import FirebaseBackend from '../../client/backend/FirebaseBackend';
import testBackend from './testBackend';
import Config from '../config/firebase.json';

describe('FirebaseBackend', () => {
  testBackend(new FirebaseBackend(Config, `${Date.now()}-${Math.random()}`));
});
