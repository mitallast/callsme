import type {
    ClientMessage, ProducerId,
    ServerConnectedConsumerTransport,
    ServerConnectedProducerTransport, ServerConsumed,
    ServerMessage, ServerProduced
} from "./types";
import {types} from "mediasoup-client";
// import type {MediaKind, RtpParameters} from "mediasoup-client";

export interface WSConnectionHandler {
    onOpen(ws: WSConnection): void;

    onClose(): void;

    onMessage(message: ServerMessage, ws: WSConnection): Promise<void>;
}

export interface WSResponseHandler<M> {
    resolve: (message: M) => void;
    reject: (reason: string) => void;
}

export class WSConnection {
    private readonly ws: WebSocket;
    // @ts-expect-error ignore handler generic type
    private readonly waitingForResponse: Map<string, WSResponseHandler> = new Map();
    private readonly handler: WSConnectionHandler;
    private sequentialMessages: Promise<void> = Promise.resolve();

    constructor(
        wsUrl: URL,
        handler: WSConnectionHandler
    ) {
        this.handler = handler;
        this.ws = new WebSocket(wsUrl.toString());
        this.ws.onmessage = (message) => this.handle(message);
        this.ws.onerror = console.error;
        this.ws.onopen = () => this.handler.onOpen(this);
        this.ws.onclose = () => {
            for (const response of this.waitingForResponse.values()) {
                response.reject('WebSocket connection closed');
            }
            this.waitingForResponse.clear();
            this.handler.onClose();
        }
    }

    public close() {
        this.ws.close();
    }

    public send(message: ClientMessage) {
        this.ws.send(JSON.stringify(message));
    }

    private call<E>(message: ClientMessage, action: string): Promise<E> {
        this.send(message);
        return new Promise((resolve, reject) => {
            this.waitingForResponse.set(action, {resolve, reject})
        });
    }

    public connectProducerTransport(dtlsParameters: types.DtlsParameters): Promise<ServerConnectedProducerTransport> {
        return this.call({
            action: 'ConnectProducerTransport',
            dtlsParameters
        }, 'ConnectedProducerTransport');
    }

    public connectConsumerTransport(dtlsParameters: types.DtlsParameters): Promise<ServerConnectedConsumerTransport> {
        return this.call({
            action: 'ConnectConsumerTransport',
            dtlsParameters
        }, 'ConnectedConsumerTransport');
    }

    public clientProduce(kind: types.MediaKind, rtpParameters: types.RtpParameters): Promise<ServerProduced> {
        return this.call({
            action: 'Produce',
            kind,
            rtpParameters
        }, 'Produced');
    }

    public clientConsume(producerId: ProducerId): Promise<ServerConsumed> {
        return this.call({
            action: 'Consume',
            producerId
        }, 'Consumed');
    }

    private handle(message: MessageEvent) {
        const decodedMessage: ServerMessage = JSON.parse(message.data);

        // All other messages go here and are assumed to be notifications
        // that correspond to previously sent requests
        const callback = this.waitingForResponse.get(decodedMessage.action);

        if (callback) {
            this.waitingForResponse.delete(decodedMessage.action);
            callback.resolve(decodedMessage);
        } else {
            // Simple hack to make sure we process all messages in order, in real-world apps
            // messages it would be useful to have messages being processed concurrently
            this.sequentialMessages = this.sequentialMessages
                .then(() => {
                    return this.handler.onMessage(decodedMessage, this);
                })
                .catch((error) => {
                    console.error('Unexpected error during message handling:', error);
                });
        }
    }
}