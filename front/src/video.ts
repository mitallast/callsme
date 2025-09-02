import {BooleanEventEmitter, ValueEventEmitter} from "./events";
import type {FrameSize} from "./types.ts";

export class VideoState {
    public readonly inputs = new ValueEventEmitter<MediaDeviceInfo[]>([]);
    public readonly selectedInput = new ValueEventEmitter<MediaDeviceInfo | null>(null);
    public readonly frameRate = new ValueEventEmitter<number>(30);
    public readonly frameSize = new ValueEventEmitter<FrameSize>([1920, 1080]);
    public readonly screenShare = new BooleanEventEmitter(false);
    public readonly pause = new BooleanEventEmitter(false);
    public readonly track = new ValueEventEmitter<MediaStreamTrack | null>(null);

    constructor() {
        this.inputs.addListener(this.updateSelectedInput.bind(this));
        this.selectedInput.addListener(this.updateSelectedTrack.bind(this));
        this.screenShare.addListener(this.updateSelectedTrack.bind(this));
        this.frameRate.addListener(this.updateConstraints.bind(this));
        this.frameSize.addListener(this.updateConstraints.bind(this));
    }

    public async init() {
        await this.updateInputs();
        navigator.mediaDevices.addEventListener('devicechange', this.updateInputs.bind(this));
    }

    private async updateInputs() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((info) => info.kind === 'videoinput');
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

    private async updateSelectedTrack() {
        const current = this.track.value
        if (current) {
            current.stop();
        }

        const screenShare = this.screenShare.value;
        if (screenShare) {
            await this.screenShareStream()
        } else {
            await this.cameraStream()
        }
    }

    private async updateConstraints() {
        const frameRate = this.frameRate.value;
        const [width, height] = this.frameSize.value;
        const current = this.track.value;
        if (current) {
            const constraint: MediaTrackConstraintSet = {
                frameRate: {ideal: frameRate},
                width: {ideal: width},
                height: {ideal: height},
            };
            console.info("applyConstraints", constraint);
            await current.applyConstraints(constraint);
            console.info("applyConstraints result", current.getSettings());
        }
    }

    private async cameraStream() {
        const info = this.selectedInput.value
        const constraints: DisplayMediaStreamOptions = {
            audio: false,
            video: {
                deviceId: info?.deviceId ? {exact: info.deviceId} : undefined,
                width: {max: 1920},
                frameRate: {max: 60},
                // при необходимости: facingMode: { ideal: "user" | "environment" }
            }
        };
        const media = await navigator.mediaDevices.getUserMedia(constraints);
        const tracks = media.getVideoTracks();
        if (tracks.length > 0) {
            await this.track.set(tracks[0]);
        } else {
            await this.track.set(null);
        }
    }

    private async screenShareStream() {
        // Экран выбирается самим браузером, deviceId тут не используется
        // В Safari/Firefox требуется явный пользовательский жест + HTTPS
        const constraints: DisplayMediaStreamOptions = {
            video: {
                // Можно попросить выбрать окно/экран/вкладку (поддержка опций отличается по браузерам)
                frameRate: {ideal: 30, max: 60}
            },
            audio: false // В Chrome можно включать системный/таб аудио; в Firefox/Safari поведение иное
        };
        const media = await navigator.mediaDevices.getDisplayMedia(constraints);
        const tracks = media.getVideoTracks();
        if (tracks.length > 0) {
            await this.track.set(tracks[0]);
        } else {
            await this.track.set(null);
        }
    }
}