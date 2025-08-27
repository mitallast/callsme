import {BooleanEventEmitter, ValueEventEmitter} from "./events";

export class AudioState {
    public readonly inputs = new ValueEventEmitter<MediaDeviceInfo[]>([]);
    public readonly selectedInput = new ValueEventEmitter<MediaDeviceInfo | null>(null);
    public readonly track = new ValueEventEmitter<MediaStreamTrack | null>(null);
    public readonly pause = new BooleanEventEmitter(false);

    constructor() {
        this.inputs.addListener(() => this.updateSelectedInput());
        this.selectedInput.addListener(() => this.updateSelectedTrack());
    }

    public async init() {
        await this.updateInputs();
        navigator.mediaDevices.addEventListener('devicechange', () => this.updateInputs());
    }

    private async updateInputs() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((info) => info.kind === 'audioinput');
        await this.inputs.set(inputs);
    }

    private async updateSelectedInput() {
        const inputs = this.inputs.value;
        const current = this.selectedInput.value;
        // check the current input is still in a list
        if (current && inputs.includes(current)) {
            return;
        }
        // otherwise, select the first input
        if (inputs.length > 0) {
            await this.selectedInput.set(inputs[0]);
        } else if (current) {
            await this.selectedInput.set(null);
        }
    }

    public async updateSelectedTrack() {
        const info = this.selectedInput.value;
        const current = this.track.value
        if (current) {
            current.stop();
        }

        const constraints = {
            audio: {
                deviceId: info?.deviceId ? {exact: info.deviceId} : undefined,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false,     // включайте по желанию
                channelCount: 1,
            },
            video: false
        };
        const media = await navigator.mediaDevices.getUserMedia(constraints);
        const tracks = media.getAudioTracks();

        if (tracks.length > 0) {
            await this.track.set(tracks[0]);
        } else {
            await this.track.set(null);
        }
    }
}