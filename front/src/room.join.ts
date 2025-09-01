import {Room} from "./room.ts";

export class RoomJoin {
    private readonly app: HTMLElement;
    private readonly container: HTMLDivElement;
    private readonly roomIdInput: HTMLInputElement;
    private readonly generateButton: HTMLButtonElement;
    private readonly form: HTMLFormElement;

    constructor(app: HTMLElement) {
        this.app = app!;

        this.roomIdInput = document.createElement('input');
        this.roomIdInput.type = 'text';
        this.roomIdInput.name = 'roomId';
        this.roomIdInput.placeholder = 'Room ID';
        this.roomIdInput.required = true;

        this.generateButton = document.createElement('button');
        this.generateButton.type = 'submit';
        this.generateButton.classList.add('material-symbols-outlined');
        this.generateButton.textContent = 'autorenew';
        this.generateButton.addEventListener('click', this.onGenerate.bind(this));

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Join';

        const submitRow = document.createElement('div');
        submitRow.classList.add('form-row');
        submitRow.append(this.generateButton);
        submitRow.append(submitButton);

        const roomIdRow = document.createElement('div');
        roomIdRow.classList.add('form-row');
        roomIdRow.append(this.roomIdInput);

        this.form = document.createElement('form');
        this.form.append(roomIdRow);
        this.form.append(submitRow);
        this.form.addEventListener('submit', this.onSubmit.bind(this));

        this.container = document.createElement('div');
        this.container.classList.add('room-join');
        this.container.append(this.form);
        this.app.append(this.container);
    }

    public init() {
        const roomId = (new URL(location.href)).searchParams.get('roomId') as string | null;
        console.log('roomId', roomId);
        if (roomId) {
            const roomIdInput = document.querySelector('input[name="roomId"]') as HTMLInputElement;
            roomIdInput.value = roomId;
        }
    }

    public destroy() {
        this.form.removeEventListener('submit', this.onSubmit);
        this.generateButton.removeEventListener('click', this.onGenerate);
        this.app.innerHTML = '';
    }

    private onGenerate(event: Event) {
        event.preventDefault();
        this.roomIdInput.value = Math.random().toString(36).substring(2, 15);
    }

    private onSubmit(event: Event) {
        event.preventDefault();
        const roomId = this.roomIdInput.value;
        const url = new URL(location.href);
        url.searchParams.set('roomId', roomId);
        history.pushState({}, '', url.toString());

        this.destroy();

        const room = new Room(this.app);
        room.init().catch((error) => console.error(error));
    }
}