import {deploy} from 'firebase-tools';
import jsdom from 'mocha-jsdom';
import path from 'path';
import Config from '../../tests/config/firebase.json';
import testBackend from '../../tests/utilities/testBackend';
import FirebaseBackend from './FirebaseBackend';

describe('FirebaseBackend', () => {
  jsdom({url: 'https://127.0.0.1'});

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
