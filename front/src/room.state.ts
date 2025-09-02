import {BooleanEventEmitter, ValueEventEmitter} from "./events";
import type {RoomId} from "./types";

export class RoomState {
    public readonly running = new BooleanEventEmitter(true);
    public readonly showSettings = new BooleanEventEmitter(false);
    public readonly roomId = new ValueEventEmitter<RoomId | null>(null);
}