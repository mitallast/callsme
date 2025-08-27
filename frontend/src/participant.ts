import {ParticipantId} from "./types";
import {VideoState} from "./video";

export class Participant {
    private readonly figure: HTMLElement;
    private readonly preview: HTMLVideoElement;

    private readonly mediaStream = new MediaStream();
    private audioTrack: MediaStreamTrack | null = null;
    private videoTrack: MediaStreamTrack | null = null;

    constructor(
        container: HTMLElement,
        public readonly id: ParticipantId
    ) {
        this.figure = document.createElement('figure');
        this.preview = document.createElement('video');

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
        public readonly id: ParticipantId,
        videoState: VideoState,
    ) {
        super(container, id);
        videoState.track.addListener(async (track) => {
            if (track) {
                this.setTrack(track);
            } else {
                this.remove('video');
            }
        });
    }
}