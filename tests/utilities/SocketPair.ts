import {EventEmitter} from 'events';

class Socket extends EventEmitter {
  public pair?: Socket;

  public emit(event: string, ...args: any): boolean {
    if (!this.pair) throw new Error();
    return this.pair.emitSelf(event, ...args);
  }

  private emitSelf(event: string, ...args: any): boolean {
    return super.emit(event, ...args);
  }
}

export default class SocketPair {
  public client = new Socket();
  public server = new Socket();

  public constructor() {
    this.client.pair = this.server;
    this.server.pair = this.client;
  }
}
