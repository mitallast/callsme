import type {ParticipantId, ProducerId} from "./types";
import {Participant} from "./participant";
import {EventEmitter} from "./events.ts";

export class Participants {
    private readonly container: HTMLElement;
    private readonly participants = new Map<ParticipantId, Participant>();
    private readonly producerIdToTrack = new Map<ProducerId, MediaStreamTrack>();
    private readonly producerIdToParticipantId = new Map<ProducerId, ParticipantId>();

    public readonly onParticipantsChanged = new EventEmitter<Participants>();

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public hasParticipants(): boolean {
        return this.participants.size > 0;
    }

    public async addTrack(
        participantId: ParticipantId,
        producerId: ProducerId,
        track: MediaStreamTrack
    ) {
        this.producerIdToTrack.set(producerId, track);
        this.producerIdToParticipantId.set(producerId, participantId);
        const participant = await this.getOrCreateParticipant(participantId);
        participant.setTrack(track);
    }

    public async deleteAll() {
        for (let [producerId, participantId] of this.producerIdToParticipantId.entries()) {
            await this.deleteTrack(participantId, producerId);
        }
        this.producerIdToParticipantId.clear();
    }

    public async deleteTrack(participantId: ParticipantId, producerId: ProducerId) {
        const track = this.producerIdToTrack.get(producerId);
        if (track) {
            this.producerIdToTrack.delete(producerId);
            this.producerIdToParticipantId.delete(producerId);

            const participant = await this.getOrCreateParticipant(participantId);

            participant.removeTrack(track);
            if (!participant.hasTracks()) {
                this.participants.delete(participantId);
                participant.destroy();
            }
        }
    }

    private async getOrCreateParticipant(id: ParticipantId) {
        let participant = this.participants.get(id);

        if (!participant) {
            participant = new Participant(this.container, id);
            this.participants.set(id, participant);
            await this.onParticipantsChanged.emit(this);
        }

        return participant;
    }
}