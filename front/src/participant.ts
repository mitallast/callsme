import type {ParticipantId} from "./types";
import {VideoState} from "./video";

export class Participant {
    protected readonly figure: HTMLElement;
    private readonly preview: HTMLVideoElement;

    public readonly id: ParticipantId;
    private readonly mediaStream = new MediaStream();
    private audioTrack: MediaStreamTrack | null = null;
    private videoTrack: MediaStreamTrack | null = null;

    constructor(
        container: HTMLElement,
        id: ParticipantId
    ) {
        this.figure = document.createElement('figure');
        this.preview = document.createElement('video');
        this.id = id;

        this.preview.muted = false;
        this.preview.controls = false;

        this.preview.onloadedmetadata = async () => {
            await this.preview.play();
        };

        const figcaption = document.createElement('figcaption');
        figcaption.innerText = id;

        this.figure.append(this.preview, figcaption);
        container.append(this.figure);
    }

    public setTrack(track: MediaStreamTrack) {
        if (track.kind === 'audio') {
            if (this.audioTrack) {
                this.mediaStream.removeTrack(this.audioTrack);
            }
            this.audioTrack = track;
        } else if (track.kind === 'video') {
            if (this.videoTrack) {
                this.mediaStream.removeTrack(this.videoTrack);
            }
            this.videoTrack = track;
        } else {
            return
        }

        this.mediaStream.addTrack(track);
        this.preview.srcObject = this.mediaStream;
    }

    public remove(kind: string) {
        if (kind === 'audio') {
            if (this.audioTrack) {
                this.mediaStream.removeTrack(this.audioTrack);
            }
            this.audioTrack = null;
        }
        if (kind === 'video') {
            if (this.videoTrack) {
                this.mediaStream.removeTrack(this.videoTrack);
            }
            this.videoTrack = null;
        } else {
            return
        }

        this.preview.srcObject = this.mediaStream;
    }

    public removeTrack(track: MediaStreamTrack): void {
        this.mediaStream.removeTrack(track);

        this.preview.srcObject = this.mediaStream;
    }

    public hasTracks(): boolean {
        return this.mediaStream.getTracks().length > 0;
    }

    public destroy(): void {
        this.preview.srcObject = null;
        this.figure.remove();
    }
}

export class SendPreview extends Participant {
    constructor(
        container: HTMLElement,
        id: ParticipantId,
        videoState: VideoState,
    ) {
        super(container, id);
        videoState.track.addListener((track) => {
            if (track) {
                this.setTrack(track);
            } else {
                this.remove('video');
            }
        });
    }

    public setOverlay(overlay: boolean) {
        if (overlay) {
            this.figure.classList.add("video-overlay");
        } else {
            this.figure.classList.remove("video-overlay");
        }
    }
}