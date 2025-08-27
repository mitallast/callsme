import {VideoState} from "./video";

export function PauseVideoButton(
    state: VideoState,
): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Pause video');
    btn.setAttribute('title', 'Pause video');
    btn.classList.add('icon', 'video');

    state.pause.addListener(async (pause) => {
        if (pause) {
            btn.classList.replace('video', 'video-slash')
        } else {
            btn.classList.replace('video-slash', 'video')
        }
    });
    btn.addEventListener('click', () => state.pause.toggle());
    return btn;
}