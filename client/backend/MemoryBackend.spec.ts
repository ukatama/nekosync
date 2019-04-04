import rules from '../../tests/utilities/rules';
import testBackend from '../../tests/utilities/testBackend';
import MemoryBackend from './MemoryBackend';

describe('MemoryBackend', () => {
  testBackend(new MemoryBackend(rules));
});
