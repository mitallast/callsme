import type {ParticipantId} from "./types";
import {VideoState} from "./video";

const makePoster = () => {
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 720;
    const g = c.getContext('2d')!;

    // фон-градиент
    const grd = g.createLinearGradient(0, 0, c.width, c.height);
    grd.addColorStop(0, '#7f5cff');
    grd.addColorStop(1, '#2b1055');
    g.fillStyle = grd;
    g.fillRect(0, 0, c.width, c.height);
    return c;
};

const poster = makePoster();

export class Participant {
    protected readonly figure: HTMLElement;
    private readonly preview: HTMLVideoElement;

    public readonly id: ParticipantId;
    private readonly mediaStream = new MediaStream();
    private audioTrack: MediaStreamTrack | null = null;
    private videoTrack: MediaStreamTrack | null = null;
    private posterTrack: MediaStreamTrack | null = null;

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
        this.remove(track.kind);
        this.mediaStream.addTrack(track);

        if (track.kind === 'video') {
            track.addEventListener('mute', this.onVideoTrackMute.bind(this));
            track.addEventListener('unmute', this.onVideoTrackUnMute.bind(this));
            track.addEventListener('ended', this.onVideoTrackEnded.bind(this));
        }

        this.preview.srcObject = this.mediaStream;
    }

    private onVideoTrackMute(event: Event) {
        const track = event.target as MediaStreamTrack;
        console.log('track muted', track);

        if (!this.posterTrack) {
            this.posterTrack = poster.captureStream(1).getVideoTracks()[0];
        }

        this.mediaStream.removeTrack(track);
        this.mediaStream.addTrack(this.posterTrack);
        this.preview.srcObject = this.mediaStream;
    }

    private onVideoTrackUnMute(event: Event) {
        const track = event.target as MediaStreamTrack;
        console.log('track unmuted', event.target);

        if (this.posterTrack) {
            this.mediaStream.removeTrack(this.posterTrack);
            this.posterTrack.stop();
            this.posterTrack = null;
        }
        this.mediaStream.addTrack(track);
        this.preview.srcObject = this.mediaStream;
    }

    private onVideoTrackEnded(event: Event) {
        const track = event.target as MediaStreamTrack;
        console.log('track ended', track);
        this.removeTrack(track);
        this.posterTrack = poster.captureStream(1).getVideoTracks()[0];
        this.mediaStream.addTrack(this.posterTrack);
        this.videoTrack = null;
        this.preview.srcObject = this.mediaStream;
    }

    public remove(kind: string) {
        if (kind === 'audio') {
            if (this.audioTrack) {
                this.removeTrack(this.audioTrack);
                this.audioTrack = null;
            }
        } else if (kind === 'video') {
            if (this.videoTrack) {
                this.removeTrack(this.videoTrack);
                this.videoTrack = null;
            }
        }
    }

    public removeTrack(track: MediaStreamTrack): void {
        this.mediaStream.removeTrack(track);
        if (track.kind === 'video') {
            track.removeEventListener('mute', this.onVideoTrackMute.bind(this));
            track.removeEventListener('unmute', this.onVideoTrackUnMute.bind(this));
            track.removeEventListener('ended', this.onVideoTrackEnded.bind(this));
        }
        track.stop();
        this.preview.srcObject = this.mediaStream;
    }

    public hasTracks(): boolean {
        return this.mediaStream.getTracks().length > 0;
    }

    public tracks() {
        return this.mediaStream.getTracks();
    }

    public destroy(): void {
        this.audioTrack?.stop();
        this.videoTrack?.stop();
        this.posterTrack?.stop();
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