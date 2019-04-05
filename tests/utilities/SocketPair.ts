import {EventEmitter} from 'events';
import shortid from 'shortid';
import Socket from '../../common/Socket';

class StubSocket extends EventEmitter implements Socket {
  public readonly id: string = shortid();
  public pair?: StubSocket;

  public emit(event: string, ...args: any): boolean {
    if (!this.pair) throw new Error();
    return this.pair.emitSelf(event, ...args);
  }

  private emitSelf(event: string, ...args: any): boolean {
    return super.emit(event, ...args);
  }
}

export default class SocketPair {
  public client = new StubSocket();
  public server = new StubSocket();

  public constructor() {
    this.client.pair = this.server;
    this.server.pair = this.client;
  }
}
