import { MongoClient } from 'mongodb';
import shortid from 'shortid';
import MongoDatastore from './MongoDatastore';

describe('MongoDatastore', () => {
  const id = shortid();
  const collection = 'nekord-test-a';

  let mongoDatastore: MongoDatastore;
  it('can initialize', async () => {
    const mongoClient = await MongoClient.connect('mongodb://127.0.0.1:27017', {
      useNewUrlParser: true,
    });
    const db = mongoClient.db('nekord');

    after(async () => {
      await mongoClient.close();
    });
    mongoDatastore = new MongoDatastore(db);
  });

  it('can update', async () => {
    await mongoDatastore.update([{ collection, id }], { a: 1 });
    await mongoDatastore.update([{ collection, id }], { a: 2 });
    await mongoDatastore.remove([{ collection, id }]);
  });
});
