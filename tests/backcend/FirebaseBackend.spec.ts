import {deploy} from 'firebase-tools';
import path from 'path';
import FirebaseBackend from '../../client/backend/FirebaseBackend';
import Config from '../config/firebase.json';
import testBackend from '../utilities/testBackend';

describe('FirebaseBackend', () => {
  it('can deploy', async () => {
    await deploy({
      cwd: path.join(__dirname, '../config'),
    });
  });
  testBackend(new FirebaseBackend(Config, `${Date.now()}-${Math.random()}`));
});
