import type {ParticipantId, ProducerId} from "./types.ts";
import {ValueEventEmitter} from "./events.ts";

export class ParticipantsState {

    private readonly participantsMap = new Map<ParticipantId, MediaStream>();
    private readonly producerIdToTrack = new Map<ProducerId, MediaStreamTrack>();
    private readonly producerIdToParticipantId = new Map<ProducerId, ParticipantId>();

    public readonly participants = new ValueEventEmitter<readonly MediaStream[]>([]);

    public async addTrack(
        participantId: ParticipantId,
        producerId: ProducerId,
        track: MediaStreamTrack
    ) {
        this.producerIdToTrack.set(producerId, track);
        this.producerIdToParticipantId.set(producerId, participantId);
        const participant = await this.getOrCreateParticipant(participantId);
        if (track.kind === 'video') {
            for (const t of participant.getVideoTracks()) {
                participant.removeTrack(t);
                t.stop();
            }
        }
        if (track.kind === 'audio') {
            for (const t of participant.getAudioTracks()) {
                participant.removeTrack(t);
                t.stop();
            }
        }
        participant.addTrack(track);
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
            console.log(`${track.kind} track deleted:`, track);

            this.producerIdToTrack.delete(producerId);
            this.producerIdToParticipantId.delete(producerId);

            const participant = this.participantsMap.get(participantId);
            if (participant) {
                participant.removeTrack(track);
                if (participant.getTracks().length === 0) {
                    console.log(`delete participant:`, participantId);
                    this.participantsMap.delete(participantId);
                    await this.participants.emit([...this.participantsMap.values()]);
                } else {
                    console.log(`keep participant:`, participant.getTracks());
                }
            }
        }
    }

    private async getOrCreateParticipant(id: ParticipantId): Promise<MediaStream> {
        let participant = this.participantsMap.get(id);

        if (!participant) {
            participant = new MediaStream();
            this.participantsMap.set(id, participant);
            await this.participants.emit([...this.participantsMap.values()]);
        }

        return participant;
    }
}