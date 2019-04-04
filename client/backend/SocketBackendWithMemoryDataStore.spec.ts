import {EventEmitter} from 'events';
import Connection from '../../server/Connection';
import MemoryDatastore from '../../server/datastore/MemoryDatastore';
import SocketPair from '../../tests/utilities/SocketPair';
import rules from '../../tests/utilities/rules';
import testBackend from '../../tests/utilities/testBackend';
import SocketBackend from './SocketBackend';

describe('SocketBackend with MemoryDatastore', () => {
  const socketPair = new SocketPair();
  const datastore = new MemoryDatastore();
  const eventBus = new EventEmitter();
  new Connection(socketPair.server, datastore, eventBus, rules);

  testBackend(new SocketBackend(socketPair.client));
});
