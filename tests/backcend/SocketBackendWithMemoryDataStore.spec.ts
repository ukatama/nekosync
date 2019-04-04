import SocketBackend from '../../client/backend/SocketBackend';
import testBackend from './testBackend';
import {EventEmitter} from 'events';
import Connection from '../../server/Connection';
import MemoryDataStore from '../../server/DataStore/MemoryDataStore';

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

class SocketPair {
  public client = new Socket();
  public server = new Socket();

  public constructor() {
    this.client.pair = this.server;
    this.server.pair = this.client;
  }
}

describe('SocketBackend', () => {
  describe('MemoryDataStore', () => {
    const socketPair = new SocketPair();
    const dataStore = new MemoryDataStore();
    const eventBus = new EventEmitter();
    new Connection(socketPair.server, dataStore, eventBus);

    testBackend(new SocketBackend(socketPair.client));
  });
});
