import type {ParticipantId, RoomId, ServerInit, ServerMessage} from "./types";
import {Device} from "mediasoup-client";
import {Participants} from "./participants";
import {WSConnection} from "./socket";
import {ProducerState} from "./producer.state";
import {AudioState} from "./audio";
import {VideoState} from "./video";
import {RoomToolbar} from "./room.toolbar";
import {RoomState} from "./room.state";
import {ConsumerState} from "./consumer.state";
import {SendPreview} from "./participant";
import type {EventListener} from "./events";
import {RoomJoin} from "./room.join.ts";

export class Room {
    private readonly roomState = new RoomState();
    private readonly audioState = new AudioState();
    private readonly videoState = new VideoState();
    private readonly producerState: ProducerState;
    private readonly consumerState: ConsumerState;

    private readonly app: HTMLElement;

    constructor(app: HTMLElement) {
        this.app = app;

        const grid = document.createElement('div');
        grid.classList.add('video-grid');

        const room = document.createElement('div');
        room.classList.add('room');
        room.append(grid);
        room.append(RoomToolbar(this.roomState, this.audioState, this.videoState));
        app.append(room);

        const preview = new SendPreview(grid, 'you' as ParticipantId, this.videoState);
        const participants = new Participants(grid);
        participants.onParticipantsChanged.addListener((participants) => {
            preview.setOverlay(participants.hasParticipants());
        });

        const device = new Device();
        this.producerState = new ProducerState(device, this.videoState, this.audioState);
        this.consumerState = new ConsumerState(device, participants);
    }

    public async init() {
        const roomId = (new URL(location.href)).searchParams.get('roomId') as RoomId | null;
        const wsUrl = new URL('ws://localhost:3000/ws');
        if (roomId) {
            wsUrl.searchParams.set('roomId', roomId);
            await this.roomState.roomId.set(roomId);
        }

        await this.videoState.init();
        await this.audioState.init();

        while (this.roomState.running.value) {
            console.log('Connecting to WebSocket server...');
            await this.connect(wsUrl);
            if (this.roomState.running.value) {
                await this.delay();
            }
        }
        console.log('room closed');

        queueMicrotask(() => {
            this.app.innerHTML = '';
            const join = new RoomJoin(this.app);
            join.init();
        });
    }

    private connect(wsUrl: URL): Promise<void> {
        return new Promise((resolve) => {
            new WSConnection(wsUrl, {
                onOpen: (conn) => {
                    const listener: EventListener<boolean> = async (running) => {
                        if (!running) {
                            this.roomState.running.removeListener(listener);
                            conn.close()
                        }
                    }
                    this.roomState.running.addListener(listener);
                },
                onClose: async () => {
                    await this.producerState.stop();
                    await this.consumerState.stop();
                    resolve(undefined);
                },
                onMessage: async (message, ws) => this.onMessage(message, ws)
            })
        });
    }

    private delay(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => resolve(undefined), 1000);
        });
    }

    private async onMessage(message: ServerMessage, ws: WSConnection): Promise<void> {
        switch (message.action) {
            case 'Init': {
                await this.onInit(message, ws);
                break;
            }
            case 'ProducerAdded': {
                await this.consumerState.onProducerAdded(message, ws);
                break;
            }
            case 'ProducerRemoved': {
                await this.consumerState.onProducerRemoved(message);
                break;
            }
            default: {
                console.error('Received unexpected message', message);
            }
        }
    }

    private async onInit(message: ServerInit, ws: WSConnection) {
        const roomId = this.roomState.roomId.value;
        if (!roomId) {
            await this.roomState.roomId.set(message.roomId);
            const url = new URL(location.href);
            url.searchParams.set('roomId', message.roomId);
            history.pushState({}, '', url.toString());
        }
        await this.producerState.start(message, ws);
        await this.consumerState.start(message, ws);
    }
}
