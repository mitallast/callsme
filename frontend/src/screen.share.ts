import {VideoState} from "./video";

export function ScreenShareButton(
    state: VideoState,
): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Screen share');
    btn.setAttribute('title', 'Screen share');
    btn.classList.add('icon', 'desktop');
    btn.addEventListener('click', () => state.screenShare.toggle());
    return btn;
}