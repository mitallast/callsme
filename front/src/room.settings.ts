import type {AudioState} from "./audio.ts";
import type {VideoState} from "./video.ts";
import type {RoomState} from "./room.state.ts";

export const RoomSettings = (
    roomState: RoomState,
    audioState: AudioState,
    videoState: VideoState,
): HTMLElement => {

    const title = document.createElement('h2');
    title.textContent = 'Settings';

    const labelAudio = document.createElement('label');
    labelAudio.textContent = 'Select audio';
    labelAudio.setAttribute('for', 'select-audio');

    const selectAudio = document.createElement('select');
    selectAudio.setAttribute('id', 'select-audio');

    const labelVideo = document.createElement('label');
    labelAudio.textContent = 'Select video';
    labelAudio.setAttribute('for', 'select-video');

    const selectVideo = document.createElement('select');
    selectVideo.setAttribute('id', 'select-video');

    const buttonClose = document.createElement('button');
    buttonClose.textContent = 'Close';

    const actions = document.createElement('div');
    actions.classList.add('row-action');
    actions.append(buttonClose);

    const panel = document.createElement('div');
    panel.classList.add('room-settings-panel');
    panel.append(title);
    panel.append(labelAudio);
    panel.append(selectAudio);
    panel.append(labelVideo);
    panel.append(selectVideo);
    panel.append(actions);

    const wrapper = document.createElement('div');
    wrapper.classList.add('room-settings', 'hidden');
    wrapper.append(panel);

    const onClose = async (event: Event) => {
        event.preventDefault();
        await roomState.showSettings.set(false);
    }

    const onShow = (show: boolean) => {
        if (show) {
            wrapper.classList.remove("hidden");
        } else {
            wrapper.classList.add("hidden");
        }
    }

    const onAudioInputsChanged = () => {
        selectAudio.innerHTML = '';
        for (const mediaDeviceInfo of audioState.inputs.value) {
            const option = document.createElement('option');
            option.value = mediaDeviceInfo.deviceId;
            option.textContent = mediaDeviceInfo.label;
            selectAudio.append(option);
        }
    }

    const onVideoInputsChanged = () => {
        selectVideo.innerHTML = '';
        for (const mediaDeviceInfo of videoState.inputs.value) {
            const option = document.createElement('option');
            option.value = mediaDeviceInfo.deviceId;
            option.textContent = mediaDeviceInfo.label;
            selectVideo.append(option);
        }
    }

    const onAudioInputChange = async () => {
        const index = selectAudio.selectedIndex;
        const device = audioState.inputs.value[index];
        console.info("audio changed", device);
        await audioState.selectedInput.set(device);
    }

    const onVideoInputChange = async () => {
        const index = selectVideo.selectedIndex;
        const device = videoState.inputs.value[index];
        console.info("video changed", device);
        await videoState.selectedInput.set(device);
    }

    const destroy = () => {
        roomState.running.removeListener(destroy);
        roomState.showSettings.removeListener(onShow);
        audioState.inputs.removeListener(onAudioInputsChanged);
        videoState.inputs.removeListener(onVideoInputsChanged);
        selectAudio.removeEventListener('change', onAudioInputChange);
        selectVideo.removeEventListener('change', onVideoInputChange);
        buttonClose.removeEventListener('click', onClose);
        wrapper.remove();
    }

    roomState.running.addListener(destroy);
    roomState.showSettings.addListener(onShow);
    audioState.inputs.addListener(onAudioInputsChanged);
    videoState.inputs.addListener(onVideoInputsChanged);
    buttonClose.addEventListener('click', onClose.bind(this));
    selectAudio.addEventListener('change', onAudioInputChange);
    selectVideo.addEventListener('change', onVideoInputChange);
    return wrapper;
};