import {EventEmitter} from 'events';
import SocketBackend from '../../client/backend/SocketBackend';
import testBackend from '../utilities/testBackend';
import Connection from '../../server/Connection';
import MongoDataStore from '../../server/DataStore/MongoDataStore';
import SocketPair from '../utilities/SocketPair';
import {MongoClient} from 'mongodb';

describe('SocketBackend with MongoDataStore', async () => {
  const mongoClient = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = mongoClient.db('nekodb');
  const socketPair = new SocketPair();
  const dataStore = new MongoDataStore(db);
  const eventBus = new EventEmitter();
  new Connection(socketPair.server, dataStore, eventBus);

  testBackend(new SocketBackend(socketPair.client));

  after(async () => {
    await mongoClient.close();
  });
});
