import {EventEmitter} from 'events';
import SocketBackend from '../../client/backend/SocketBackend';
import testBackend from '../utilities/testBackend';
import Connection from '../../server/Connection';
import MongoDatastore from '../../server/datastore/MongoDatastore';
import SocketPair from '../utilities/SocketPair';
import {MongoClient} from 'mongodb';
import rules from '../utilities/rules';

describe('SocketBackend with MongoDatastore', async () => {
  const mongoClient = await MongoClient.connect('mongodb://127.0.0.1:27017', {useNewUrlParser: true});
  const db = mongoClient.db('nekord');
  const socketPair = new SocketPair();
  const datastore = new MongoDatastore(db);
  const eventBus = new EventEmitter();
  new Connection(socketPair.server, datastore, eventBus, rules);

  testBackend(new SocketBackend(socketPair.client));

  after(async () => {
    await mongoClient.close();
  });
});
