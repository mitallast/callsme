import {Room} from "./room";

document.addEventListener('DOMContentLoaded', async () => {
    const app: HTMLElement = document.querySelector('#app')!;
    const room = new Room(app);
    await room.init();
})