import {EventEmitter} from 'events';
import SocketBackend from '../../client/backend/SocketBackend';
import testBackend from '../utilities/testBackend';
import Connection from '../../server/Connection';
import MemoryDataStore from '../../server/DataStore/MemoryDataStore';
import SocketPair from '../utilities/SocketPair';

describe('SocketBackend', () => {
  describe('MemoryDataStore', () => {
    const socketPair = new SocketPair();
    const dataStore = new MemoryDataStore();
    const eventBus = new EventEmitter();
    new Connection(socketPair.server, dataStore, eventBus);

    testBackend(new SocketBackend(socketPair.client));
  });
});
