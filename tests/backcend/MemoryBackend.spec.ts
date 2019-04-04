import MemoryBackend from '../../client/backend/MemoryBackend';
import testBackend from './testBackend';

describe('MemoryBackend', () => {
  testBackend(new MemoryBackend());
});
