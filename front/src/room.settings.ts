import type {RoomState} from "./room.state.ts";
import type {FrameSize} from "./types.ts";

export const RoomSettings = (roomState: RoomState): HTMLElement => {
    const video = roomState.producerState.video;
    const audio = roomState.producerState.audio;

    const title = document.createElement('h2');
    title.textContent = 'Settings';

    const labelAudio = document.createElement('label');
    labelAudio.textContent = 'Select audio';
    labelAudio.setAttribute('for', 'select-audio');

    const selectAudio = document.createElement('select');
    selectAudio.setAttribute('id', 'select-audio');

    const labelVideo = document.createElement('label');
    labelVideo.textContent = 'Select video';
    labelVideo.setAttribute('for', 'select-video');

    const selectVideo = document.createElement('select');
    selectVideo.setAttribute('id', 'select-video');

    const labelFrameSize = document.createElement('label');
    labelFrameSize.innerText = 'Frame size';
    labelFrameSize.setAttribute('for', 'frame-size');

    const selectFrameSize = document.createElement('select');
    selectFrameSize.setAttribute('id', 'frame-size');

    const labelFrameRate = document.createElement('label');
    labelFrameRate.innerText = 'Frame rate';
    labelFrameRate.setAttribute('for', 'frame-rate');

    const frameSizes: FrameSize[] = [];
    const inputFrameRate = document.createElement('input');
    inputFrameRate.setAttribute('type', 'range');
    inputFrameRate.setAttribute('min', '1');
    inputFrameRate.setAttribute('max', '30');
    inputFrameRate.setAttribute('value', '30');
    inputFrameRate.setAttribute('id', 'frame-rate');

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
    panel.append(labelFrameSize);
    panel.append(selectFrameSize);
    panel.append(labelFrameRate);
    panel.append(inputFrameRate);
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
        for (const mediaDeviceInfo of audio.inputs.value) {
            const option = document.createElement('option');
            option.value = mediaDeviceInfo.deviceId;
            option.textContent = mediaDeviceInfo.label;
            selectAudio.append(option);
        }
    }

    const onVideoInputsChanged = () => {
        selectVideo.innerHTML = '';
        for (const mediaDeviceInfo of video.inputs.value) {
            const option = document.createElement('option');
            option.value = mediaDeviceInfo.deviceId;
            option.textContent = mediaDeviceInfo.label;
            selectVideo.append(option);
        }
    }

    const onAudioInputChange = async () => {
        const index = selectAudio.selectedIndex;
        const device = audio.inputs.value[index];
        console.info("audio changed", device);
        await audio.selectedInput.set(device);
    }

    const onVideoInputChange = async () => {
        const index = selectVideo.selectedIndex;
        const device = video.inputs.value[index];
        console.info("video changed", device);
        await video.selectedInput.set(device);
    }

    const onVideoTrackChanged = (track: MediaStreamTrack | null) => {
        if (track) {
            const capabilities = track.getCapabilities();
            const settings = track.getSettings();
            console.log("settings", track.getSettings());

            const frameRateMin: number = capabilities.frameRate?.min || 1;
            const frameRateMax: number = settings.frameRate || capabilities.frameRate?.max || 30;
            inputFrameRate.min = frameRateMin.toString();
            inputFrameRate.max = frameRateMax.toString();
            inputFrameRate.value = frameRateMax.toString();
            labelFrameRate.innerText = `Frame rate: ${frameRateMax}`;

            const aspectRatio = settings.aspectRatio || 1.7777777777777777;

            const supportedHeight = [1080, 720, 480, 360, 240, 144];

            const widthMin = 240;
            const widthMax = settings.width || capabilities.width?.max || 1920;

            const heightMin = 120;
            const heightMax = settings.height || capabilities.height?.max || 1080;

            frameSizes.length = 0;
            for (const height of supportedHeight) {
                const width = Math.floor(height * aspectRatio);
                if (width >= widthMin && width <= widthMax &&
                    height >= heightMin && height <= heightMax) {
                    frameSizes.push([width, height]);
                }
            }

            console.log("frameSizes", frameSizes);
            selectFrameSize.innerHTML = '';
            for (const [w, h] of frameSizes) {
                const option = document.createElement('option');
                option.value = `${w}x${h}`;
                option.textContent = `${w}x${h}`;
                selectFrameSize.append(option);
            }
        }
    }

    const onFrameSizeChange = async () => {
        const index = selectFrameSize.selectedIndex;
        const size = frameSizes[index];
        if (size) {
            await video.frameSize.set(size);
        }
    };

    const onFrameRateUpdated = (frameRate: number) => {
        const current = parseInt(inputFrameRate.value);
        if (current !== frameRate) {
            inputFrameRate.value = frameRate.toString();
        }
    }
    const onFrameRateInput = async () => {
        const frameRate = parseInt(inputFrameRate.value);
        labelFrameRate.innerText = `Frame rate: ${frameRate}`;
    }
    const onFrameRateChange = async () => {
        const frameRate = parseInt(inputFrameRate.value);
        labelFrameRate.innerText = `Frame rate: ${frameRate}`;
        await video.frameRate.set(frameRate);
    }

    const destroy = () => {
        roomState.running.removeListener(destroy);
        roomState.showSettings.removeListener(onShow);
        audio.inputs.removeListener(onAudioInputsChanged);
        video.inputs.removeListener(onVideoInputsChanged);
        video.track.removeListener(onVideoTrackChanged);
        video.frameRate.removeListener(onFrameRateUpdated);
        inputFrameRate.removeEventListener('input', onFrameRateInput);
        inputFrameRate.removeEventListener('change', onFrameRateChange);
        selectAudio.removeEventListener('change', onAudioInputChange);
        selectVideo.removeEventListener('change', onVideoInputChange);
        buttonClose.removeEventListener('click', onClose);
        selectFrameSize.removeEventListener('change', onFrameSizeChange);
        wrapper.remove();
    }

    roomState.running.addListener(destroy);
    roomState.showSettings.addListener(onShow);
    audio.inputs.addListener(onAudioInputsChanged);
    video.inputs.addListener(onVideoInputsChanged);
    video.track.addListener(onVideoTrackChanged);
    video.frameRate.addListener(onFrameRateUpdated);
    inputFrameRate.addEventListener('input', onFrameRateInput);
    inputFrameRate.addEventListener('change', onFrameRateChange);
    buttonClose.addEventListener('click', onClose);
    selectAudio.addEventListener('change', onAudioInputChange);
    selectVideo.addEventListener('change', onVideoInputChange);
    selectFrameSize.addEventListener('change', onFrameSizeChange);
    return wrapper;
};