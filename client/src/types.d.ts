declare module 'simple-peer' {
  interface PeerOptions {
    initiator?: boolean;
    channelConfig?: object;
    channelName?: string;
    config?: object;
    offerOptions?: object;
    answerOptions?: object;
    sdpTransform?: (sdp: string) => string;
    stream?: MediaStream;
    streams?: MediaStream[];
    trickle?: boolean;
    allowHalfTrickle?: boolean;
    objectMode?: boolean;
    wrtc?: object;
  }

  interface Instance extends EventEmitter {
    signal(data: any): void;
    send(data: any): void;
    destroy(err?: Error): void;
    _channel?: {
      send: (data: string) => void;
    };
  }

  interface EventEmitter {
    on(event: string, listener: Function): this;
    once(event: string, listener: Function): this;
    off(event: string, listener: Function): this;
    removeListener(event: string, listener: Function): this;
    removeAllListeners(event?: string): this;
    emit(event: string, ...args: any[]): boolean;
  }

  function SimplePeer(opts?: PeerOptions): Instance;
  
  export = SimplePeer;
}