import MemoryBackend from '../../client/backend/MemoryBackend';
import testBackend from '../utilities/testBackend';

describe('MemoryBackend', () => {
  testBackend(new MemoryBackend());
});
