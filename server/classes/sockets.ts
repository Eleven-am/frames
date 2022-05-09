export default class Socket<S> {
    public readonly socketAddress: string;
    public connected: boolean;
    public socket: WebSocket | undefined;
    private _eventHandlers: {[event: string]: ((data: any) => void)[]} = {};
    private _dataToSend: S[] = [];

    /**
     * @desc Creates a new socket.
     * @param socketAddress The address of the socket.
     */
    constructor(socketAddress: string) {
        this.socketAddress = socketAddress;
        this.connected = false;
    }

    /**
     * @desc Sends data using the socket.
     * @param data The data to send.
     */
    public push(data: S) {
        if (this.socket?.readyState === WebSocket.OPEN)
            this.socket.send(JSON.stringify(data));

        else
            this._dataToSend.push(data);

        return this;
    }

    /**
     * @desc subscribes to the message event of the socket.
     * @param callback The callback to call when the event is triggered.
     */
    public subscribe(callback: (data: S) => void) {
        const onMessage = this._eventHandlers["message"] ?? [];
        onMessage.push(callback);
        this._eventHandlers["message"] = onMessage;
        return this;
    }

    /**
     * @desc subscribes to the open event of the socket.
     * @param callback The callback to call when the socket is open.
     */
    public onConnect(callback: () => void) {
        const onOpen = this._eventHandlers["open"] ?? [];
        onOpen.push(callback);
        this._eventHandlers["open"] = onOpen;
        return this;
    }

    /**
     * @desc subscribes to the close event of the socket.
     * @param callback The callback to call when the socket closes.
     */
    public onDisconnect(callback: () => void) {
        const onClose = this._eventHandlers["close"] ?? [];
        onClose.push(callback);
        this._eventHandlers["close"] = onClose;
        return this;
    }

    /**
     * @desc opens a connection to the socket.
     */
    public connect() {
        this.socket = new WebSocket(this.socketAddress);
        this.socket.addEventListener('open', () => {
            this.connected = true;
            const onconnect = this._eventHandlers["open"] ?? [];
            onconnect.forEach(callback => callback('open'));
            this._dataToSend.forEach(data => this.push(data));
            this._dataToSend = [];

            this.socket!.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const onmessage = this._eventHandlers["message"] ?? [];
                onmessage.forEach(callback => callback(data));
            };
        });

        this.socket.addEventListener('close', () => {
            this.connected = false;
            const onclose = this._eventHandlers["close"] ?? [];
            onclose.forEach(callback => callback('close'));
        });

        this.socket.addEventListener('error', () => {
            this.connected = false;
            const onerror = this._eventHandlers["error"] ?? [];
            onerror.forEach(callback => callback('error'));
        });
        return this;
    }

    /**
     * @desc closes the socket.
     */
    public disconnect() {
        this.socket?.close();
        return this;
    }
}