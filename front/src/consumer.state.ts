import {ValueEventEmitter} from "./events";
import {types, Device} from "mediasoup-client";
import type {ConsumerId, ServerInit, ServerProducerAdded, ServerProducerRemoved} from "./types";
import {WSConnection} from "./socket";
import {Participants} from "./participants";

export class ConsumerState {
    private readonly device: Device;
    private readonly participants: Participants;

    public readonly consumerTransport = new ValueEventEmitter<types.Transport | null>(null);

    constructor(device: Device, participants: Participants) {
        this.device = device;
        this.participants = participants;
    }

    public async start(message: ServerInit, ws: WSConnection) {
        // Producer transport will be needed to receive produced tracks
        const transport = this.device.createRecvTransport(message.consumerTransportOptions);
        transport.on('connect', ({dtlsParameters}, success) => {
            // Send a request to establish consumer transport connection
            ws.connectConsumerTransport(dtlsParameters)
                .then(() => success())
                .catch((error) => console.error(error))
        });

        await this.consumerTransport.set(transport);
    }

    public async stop() {
        await this.participants.deleteAll();
        if (this.consumerTransport.value) {
            this.consumerTransport.value.close();
            await this.consumerTransport.set(null);
        }
    }

    public async onProducerAdded(message: ServerProducerAdded, ws: WSConnection) {
        const consumerOptions: types.ConsumerOptions = await ws.clientConsume(message.producerId)

        // Once confirmation is received, a corresponding consumer
        // can be created client-side
        const consumer = await this.consumerTransport.value!.consume(consumerOptions);
        console.log(`${consumer.kind} consumer created:`, consumer);

        // Consumer needs to be resumed after being created in
        //  a paused state (see official documentation about why:
        // https://mediasoup.org/documentation/v3/mediasoup/api/#transport-consume)
        ws.send({
            action: 'ConsumerResume',
            id: consumer.id as ConsumerId
        });

        await this.participants.addTrack(message.participantId, message.producerId, consumer.track);
    }

    public async onProducerRemoved(message: ServerProducerRemoved) {
        await this.participants.deleteTrack(message.participantId, message.producerId);
    }
}