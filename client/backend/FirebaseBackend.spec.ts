import {deploy} from 'firebase-tools';
import path from 'path';
import Config from '../../tests/config/firebase.json';
import testBackend from '../../tests/utilities/testBackend';
import FirebaseBackend from './FirebaseBackend';

describe('FirebaseBackend', () => {
  it('can deploy', async () => {
    await deploy({
      token: process.env.FIREBASE_TOKEN,
      cwd: path.join(__dirname, '../../tests/config'),
    });
  });

  const backend = new FirebaseBackend(Config, `${Date.now()}-${Math.random()}`);
  testBackend(backend);

  after(async () => {
    await backend.app.delete();
  });
});
