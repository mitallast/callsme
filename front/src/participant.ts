import type {ParticipantId} from "./types";
import type {ParticipantsState} from "./participants.state";
import {VideoState} from "./video.state";

export const Participant = (id: ParticipantId, stream: MediaStream) => {
    const preview = document.createElement('video');
    preview.muted = false;
    preview.controls = false;
    preview.srcObject = stream;
    preview.onloadedmetadata = async () => preview.play();

    const figcaption = document.createElement('figcaption');
    figcaption.innerText = id;

    const figure = document.createElement('figure');
    figure.dataset.id = id;
    figure.append(preview, figcaption);
    return figure;
}

export const SendPreview = (
    id: ParticipantId,
    video: VideoState,
    participants: ParticipantsState,
) => {
    const participant = Participant(id, video.stream);
    participants.participants.addListener((participants) => {
        if (participants.length === 0) {
            participant.classList.remove("video-overlay");
        } else {
            participant.classList.add("video-overlay");
        }
    })
    return participant;
}