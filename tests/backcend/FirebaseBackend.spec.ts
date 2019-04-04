import {deploy} from 'firebase-tools';
import path from 'path';
import FirebaseBackend from '../../client/backend/FirebaseBackend';
import Config from '../config/firebase.json';
import testBackend from '../utilities/testBackend';

describe('FirebaseBackend', () => {
  it('can deploy', async () => {
    await deploy({
      token: process.env.FIREBASE_TOKEN,
      cwd: path.join(__dirname, '../config'),
    });
  });

  const backend = new FirebaseBackend(Config, `${Date.now()}-${Math.random()}`);
  testBackend(backend);

  after(async () => {
    await backend.app.delete();
  });
});
