import {Device} from "mediasoup-client";
import {Transport} from "mediasoup-client/lib/Transport";
import {Producer} from "mediasoup-client/lib/Producer";
import {ServerInit} from "./types";
import {WSConnection} from "./socket";
import {BooleanEventEmitter, ValueEventEmitter} from "./events";
import {AudioState} from "./audio";
import {VideoState} from "./video";

export class ProducerState {

    private readonly producerTransport = new ValueEventEmitter<Transport | null>(null);

    private readonly videoTrack: ValueEventEmitter<MediaStreamTrack | null>;
    private readonly videoTrackPause: BooleanEventEmitter;
    private readonly videoTrackProducer = new ValueEventEmitter<Producer | null>(null);

    private readonly audioTrack: ValueEventEmitter<MediaStreamTrack | null>;
    private readonly audioTrackPause: BooleanEventEmitter;
    private readonly audioTrackProducer = new ValueEventEmitter<Producer | null>(null);

    constructor(
        private readonly device: Device,
        videoState: VideoState,
        audioState: AudioState,
    ) {
        this.videoTrack = videoState.track;
        this.videoTrackPause = videoState.pause;
        this.audioTrack = audioState.track;
        this.audioTrackPause = audioState.pause;

        this.videoTrack.addListener(() => this.updateVideoTrackProducer());
        this.audioTrack.addListener(() => this.updateAudioTrackProducer());
        this.producerTransport.addListener(() => this.updateAudioTrackProducer());
        this.producerTransport.addListener(() => this.updateVideoTrackProducer());

        this.videoTrackPause.addListener(() => this.updateVideoPause());
        this.videoTrackProducer.addListener(() => this.updateVideoPause());

        this.audioTrackPause.addListener(() => this.updateAudioPause());
        this.audioTrackProducer.addListener(() => this.updateAudioPause());
    }

    public async start(message: ServerInit, ws: WSConnection) {
        // It is expected that the server will send an initialization message right after
        //  the WebSocket connection is established
        await this.device.load({
            routerRtpCapabilities: message.routerRtpCapabilities
        });

        // Send a client-side initialization message back right away
        ws.send({
            action: 'Init',
            rtpCapabilities: this.device.rtpCapabilities
        });

        const transport = this.device.createSendTransport(message.producerTransportOptions);

        transport
            .on('connect', ({dtlsParameters}, success) => {
                ws.connectProducerTransport(dtlsParameters)
                    .then(() => success())
                    .catch((error) => console.error(error));
            })
            .on('produce', ({kind, rtpParameters}, success) => {
                // Once a connection is established, send a request to produce
                // audio or video track
                ws.clientProduce(kind, rtpParameters)
                    .then((response) => success({id: response.id}))
                    .catch((error) => console.error(error));
            });

        await this.producerTransport.set(transport);
    }

    private async updateAudioTrackProducer() {
        const transport = this.producerTransport.value;
        const track = this.audioTrack.value
        const current = this.audioTrackProducer.value;

        if (!transport) return

        if (track) {
            if (current) {
                await current.replaceTrack({track});
            } else {
                const producer = await transport.produce({track});
                await this.audioTrackProducer.set(producer);
            }
        } else if (current) {
            current.close();
            await this.audioTrackProducer.set(null);
        }
    }

    private async updateVideoTrackProducer() {
        const transport = this.producerTransport.value;
        const track = this.videoTrack.value
        const current = this.videoTrackProducer.value;

        if (!transport) return

        if (track) {
            if (current) {
                await current.replaceTrack({track});
            } else {
                const producer = await transport.produce({track});
                await this.videoTrackProducer.set(producer);
            }
        } else if (current) {
            current.close();
            await this.videoTrackProducer.set(null);
        }
    }

    private async updateAudioPause() {
        const producer = this.audioTrackProducer.value;
        const pause = this.audioTrackPause.value;
        if (producer) {
            if (pause) {
                producer.pause();
            } else {
                producer.resume();
            }
        }
    }

    private async updateVideoPause() {
        const producer = this.videoTrackProducer.value;
        const pause = this.videoTrackPause.value;
        if (producer) {
            if (pause) {
                producer.pause();
            } else {
                producer.resume();
            }
        }
    }

    public async stop() {
        if (this.videoTrack.value) {
            this.videoTrack.value.stop();
            await this.videoTrack.set(null);
        }
        if (this.audioTrack.value) {
            this.audioTrack.value.stop();
            await this.audioTrack.set(null);
        }
        if (this.videoTrackProducer.value) {
            this.videoTrackProducer.value.close();
            await this.videoTrackProducer.set(null);
        }
        if (this.audioTrackProducer.value) {
            this.audioTrackProducer.value.close();
            await this.audioTrackProducer.set(null);
        }
        if (this.producerTransport.value) {
            this.producerTransport.value.close();
            await this.producerTransport.set(null);
        }
    }
}