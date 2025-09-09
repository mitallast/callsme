import {BooleanEventEmitter, type EventListener, ValueEventEmitter} from "./events";
import type {RoomId, ServerInit, ServerMessage} from "./types";

import {WSConnection} from "./socket.ts";
import {ProducerState} from "./producer.state.ts";
import {ConsumerState} from "./consumer.state.ts";
import {Device} from "mediasoup-client";

export class RoomState {
    public readonly running = new BooleanEventEmitter(true);
    public readonly showSettings = new BooleanEventEmitter(false);
    public readonly roomId = new ValueEventEmitter<RoomId | null>(null);

    private readonly device = new Device();
    public readonly producerState: ProducerState = new ProducerState(this.device);
    public readonly consumerState: ConsumerState = new ConsumerState(this.device);

    public async run(): Promise<void> {
        await this.producerState.video.init();
        await this.producerState.audio.init();

        const wsUrl = new URL(location.href);
        wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        if (wsUrl.hostname === 'localhost' && wsUrl.port === '5173') {
            wsUrl.port = '3000';
        }
        wsUrl.pathname = '/ws';
        if (this.roomId.value) {
            wsUrl.searchParams.set('roomId', this.roomId.value);
        }

        while (this.running.value) {
            console.log('Connecting to WebSocket server...');
            await this.connect(wsUrl);
            if (this.running.value) {
                await this.delay();
            }
        }
        console.log('room closed');
    }

    private connect(wsUrl: URL): Promise<void> {
        return new Promise((resolve) => {
            new WSConnection(wsUrl, {
                onOpen: (conn) => {
                    const listener: EventListener<boolean> = async (running) => {
                        if (!running) {
                            this.running.removeListener(listener);
                            conn.close()
                        }
                    }
                    this.running.addListener(listener);
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
        const roomId = this.roomId.value;
        if (!roomId) {
            await this.roomId.set(message.roomId);
            const url = new URL(location.href);
            url.searchParams.set('roomId', message.roomId);
            history.pushState({}, '', url.toString());
        }
        await this.producerState.start(message, ws);
        await this.consumerState.start(message, ws);
    }
}