import { assert } from 'chai';
import { getId, EmptyPathError } from './Path';

describe('Path', () => {
  describe('getId', () => {
    it('throws EmptyPathError', () => {
      assert.throws(() => getId([]), EmptyPathError);
    });
  });
});
