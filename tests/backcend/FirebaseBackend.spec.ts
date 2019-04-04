import FirebaseBackend from '../../client/backend/FirebaseBackend';
import Config from '../config/firebase.json';
import testBackend from '../utilities/testBackend';

describe('FirebaseBackend', () => {
  testBackend(new FirebaseBackend(Config, `${Date.now()}-${Math.random()}`));
});
