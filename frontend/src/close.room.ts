import {RoomState} from "./room.state";

export function CloseRoomButton(roomState: RoomState): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Close room');
    btn.setAttribute('title', 'Close room');
    btn.classList.add('icon', 'call-slash');
    btn.addEventListener('click', () => roomState.running.set(false));
    return btn;
}