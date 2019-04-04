import {EventEmitter} from 'events';
import SocketBackend from '../../client/backend/SocketBackend';
import testBackend from '../utilities/testBackend';
import Connection from '../../server/Connection';
import MemoryDatastore from '../../server/datastore/MemoryDatastore';
import SocketPair from '../utilities/SocketPair';
import rules from '../utilities/rules';

describe('SocketBackend with MemoryDatastore', () => {
  const socketPair = new SocketPair();
  const datastore = new MemoryDatastore();
  const eventBus = new EventEmitter();
  new Connection(socketPair.server, datastore, eventBus, rules);

  testBackend(new SocketBackend(socketPair.client));
});
