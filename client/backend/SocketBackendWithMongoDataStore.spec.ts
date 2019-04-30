import { EventEmitter } from 'events';
import { MongoClient } from 'mongodb';
import path from 'path';
import MongoDatastore from '../../server/datastore/MongoDatastore';
import Connection from '../../server/Connection';
import SocketPair from '../../tests/utilities/SocketPair';
import rules from '../../tests/utilities/rules';
import testBackend from '../../tests/utilities/testBackend';
import SocketBackend from './SocketBackend';

describe('SocketBackend with MongoDatastore', async () => {
  const mongoClient = await MongoClient.connect('mongodb://127.0.0.1:27017', {
    useNewUrlParser: true,
  });
  const db = mongoClient.db('nekord');
  const socketPair = new SocketPair();
  const datastore = new MongoDatastore(db);
  const eventBus = new EventEmitter();
  new Connection({
    socket: socketPair.server,
    datastore,
    eventBus,
    rules,
    filepath: path.join(__dirname, '../../data'),
  });

  testBackend(new SocketBackend(socketPair.client));

  after(async () => {
    await mongoClient.close();
  });
});
