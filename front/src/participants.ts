import type {ParticipantId, ProducerId} from "./types";
import {Participant} from "./participant";

export class Participants {
    private readonly container: HTMLElement;
    private readonly participants = new Map<ParticipantId, Participant>();
    private readonly producerIdToTrack = new Map<ProducerId, MediaStreamTrack>();
    private readonly producerIdToParticipantId = new Map<ProducerId, ParticipantId>();

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public addTrack(
        participantId: ParticipantId,
        producerId: ProducerId,
        track: MediaStreamTrack): void {
        this.producerIdToTrack.set(producerId, track);
        this.producerIdToParticipantId.set(producerId, participantId);
        this.getOrCreateParticipant(participantId).setTrack(track);
    }

    public deleteAll() {
        this.producerIdToParticipantId.forEach((participantId, producerId) => {
            this.deleteTrack(participantId, producerId);
        });
        this.producerIdToParticipantId.clear();
    }

    public deleteTrack(participantId: ParticipantId, producerId: ProducerId) {
        const track = this.producerIdToTrack.get(producerId);
        if (track) {
            this.producerIdToTrack.delete(producerId);
            this.producerIdToParticipantId.delete(producerId);

            const participant = this.getOrCreateParticipant(participantId);

            participant.removeTrack(track);
            if (!participant.hasTracks()) {
                this.participants.delete(participantId);
                participant.destroy();
            }
        }
    }

    getOrCreateParticipant(id: ParticipantId): Participant {
        let participant = this.participants.get(id);

        if (!participant) {
            participant = new Participant(this.container, id);
            this.participants.set(id, participant);
        }

        return participant;
    }
}