import {AudioState} from "./audio";

export function PauseAudioButton(
    state: AudioState,
): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Pause microphone');
    btn.setAttribute('title', 'Pause microphone');
    btn.classList.add('icon', 'microphone-lines');

    state.pause.addListener(async (pause) => {
        if (pause) {
            btn.classList.replace('microphone-lines', 'microphone-lines-slash')
        } else {
            btn.classList.replace('microphone-lines-slash', 'microphone-lines')
        }
    });
    btn.addEventListener('click', () => state.pause.toggle());
    return btn;
}