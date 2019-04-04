import MemoryBackend from '../../client/backend/MemoryBackend';
import testBackend from '../utilities/testBackend';
import rules from '../utilities/rules';

describe('MemoryBackend', () => {
  testBackend(new MemoryBackend(rules));
});
