import {BooleanEventEmitter, ValueEventEmitter} from "./events";
import {RoomId} from "./types";

export class RoomState {
    public readonly running = new BooleanEventEmitter(true);
    public readonly roomId = new ValueEventEmitter<RoomId | null>(null);
}