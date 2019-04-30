import jsdom from 'mocha-jsdom';
import rules from '../../tests/utilities/rules';
import testBackend from '../../tests/utilities/testBackend';
import MemoryBackend from './MemoryBackend';

describe('MemoryBackend', () => {
  jsdom({ url: 'https://127.0.0.1' });
  URL.createObjectURL = () => 'url';
  URL.revokeObjectURL = () => {};
  testBackend(new MemoryBackend(rules));
});
