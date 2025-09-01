export type EventListener<T> = (event: T) => Promise<void> | void;

export class EventEmitter<T> {
    private readonly listeners = new Set<EventListener<T>>();

    public async emit(event: T): Promise<void> {
        for (const listener of this.listeners) {
            const promise = listener(event);
            if (promise instanceof Promise) {
                await promise;
            }
        }
    }

    public addListener(listener: EventListener<T>): void {
        this.listeners.add(listener);
    }

    public removeListener(listener: EventListener<T>): void {
        this.listeners.delete(listener);
    }
}

export class ValueEventEmitter<T> extends EventEmitter<T> {
    private _value: T;

    public constructor(value: T) {
        super();
        this._value = value;
    }

    public async set(value: T): Promise<void> {
        this._value = value;
        await this.emit(value);
    }

    public get value(): T {
        return this._value;
    }
}

export class BooleanEventEmitter extends ValueEventEmitter<boolean> {
    public constructor(value: boolean) {
        super(value);
    }

    public async toggle(): Promise<void> {
        await this.set(!this.value);
    }
}