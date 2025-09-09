import type {ParticipantId, RoomId} from "./types";
import {RoomToolbar} from "./room.toolbar";
import {RoomState} from "./room.state";
import {SendPreview, Participant} from "./participant";
import {RoomJoin} from "./room.join.ts";
import {RoomSettings} from "./room.settings.ts";

export class Room {
    private readonly roomState = new RoomState();

    private readonly app: HTMLElement;

    constructor(app: HTMLElement) {
        this.app = app;

        const grid = document.createElement('div');
        grid.classList.add('video-grid');
        grid.append(SendPreview('you' as ParticipantId, this.roomState.producerState.video, this.roomState.consumerState.participants));

        const streamMap = new Map<string, HTMLElement>();
        this.roomState.consumerState.participants.participants.addListener((participants) => {
            const streamSet = new Set<string>();
            streamSet.add('you');
            for (const stream of participants) {
                streamSet.add(stream.id);
                if (!streamMap.has(stream.id)) {
                    grid.append(Participant(stream.id as ParticipantId, stream));
                }
            }
            for (const view of (grid.children as Iterable<HTMLElement>)) {
                if (view.dataset.id && !streamSet.has(view.dataset.id)) {
                    view.remove();
                }
            }
        });

        const room = document.createElement('div');
        room.classList.add('room');
        room.append(grid);
        room.append(RoomSettings(this.roomState));
        room.append(RoomToolbar(this.roomState));
        app.append(room);
    }

    public async init() {
        const roomId = (new URL(location.href)).searchParams.get('roomId') as RoomId | null;
        if (roomId) {
            await this.roomState.roomId.set(roomId);
        }

        await this.roomState.run();

        queueMicrotask(() => {
            this.app.innerHTML = '';
            const join = new RoomJoin(this.app);
            join.init();
        });
    }
}
