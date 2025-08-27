import {AudioState} from "./audio";
import {VideoState} from "./video";
import {PauseAudioButton} from "./pause.audio";
import {PauseVideoButton} from "./pause.video";
import {ScreenShareButton} from "./screen.share";
import {CloseRoomButton} from "./close.room";
import {RoomState} from "./room.state";

export function RoomToolbar(
    roomState: RoomState,
    audioState: AudioState,
    videoState: VideoState,
): HTMLDivElement {
    const tool: HTMLDivElement = document.createElement('div');
    tool.classList.add('room-toolbar');
    tool.setAttribute('role', 'toolbar');
    tool.setAttribute('aria-label', 'toolbar');

    tool.append(PauseAudioButton(audioState));
    tool.append(PauseVideoButton(videoState));
    tool.append(ScreenShareButton(videoState));
    tool.append(CloseRoomButton(roomState));
    return tool;
}