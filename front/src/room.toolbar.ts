import {AudioState} from "./audio";
import {VideoState} from "./video";
import {RoomState} from "./room.state";

const Button = (title: string, icon: string): HTMLButtonElement => {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', title);
    btn.setAttribute('title', title);
    btn.classList.add('icon', 'material-symbols-outlined');
    btn.innerText = icon;
    return btn;
};

const PauseAudioButton = (state: AudioState): HTMLButtonElement => {
    const btn = Button("Pause audio", 'mic');
    state.pause.addListener(async (pause) => {
        btn.innerText = pause ? 'mic_off' : 'mic';
    });
    btn.addEventListener('click', () => state.pause.toggle());
    return btn;
};

const PauseVideoButton = (state: VideoState): HTMLButtonElement => {
    const btn = Button("Pause video", 'videocam');
    state.pause.addListener(async (pause) => {
        btn.innerText = pause ? 'videocam_off' : 'videocam';
    });
    btn.addEventListener('click', () => state.pause.toggle());
    return btn;
};

const ScreenShareButton = (state: VideoState): HTMLButtonElement => {
    const btn = Button("Screen share", 'screen_share');
    btn.addEventListener('click', () => state.screenShare.toggle());
    return btn;
};

const CloseRoomButton = (roomState: RoomState): HTMLButtonElement => {
    const btn = Button("Close room", 'call_end');
    btn.addEventListener('click', () => roomState.running.set(false));
    return btn;
};

export const RoomToolbar = (
    roomState: RoomState,
    audioState: AudioState,
    videoState: VideoState,
): HTMLDivElement => {
    const tool: HTMLDivElement = document.createElement('div');
    tool.classList.add('room-toolbar');
    tool.setAttribute('role', 'toolbar');
    tool.setAttribute('aria-label', 'toolbar');

    tool.append(PauseAudioButton(audioState));
    tool.append(PauseVideoButton(videoState));
    tool.append(ScreenShareButton(videoState));
    tool.append(CloseRoomButton(roomState));
    return tool;
};