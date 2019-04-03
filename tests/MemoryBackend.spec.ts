import {assert} from 'chai';
import {fake} from 'sinon';
import MemoryBackend from '../client/backend/MemoryBackend';
import {Unsubscribe} from '../client/backend/Backend';

describe('StubBackend', () => {
  let backend: MemoryBackend;
  it('can initialize', () => {
    backend = new MemoryBackend();
  });

  describe('value', () => {
    describe('simple collection', () => {
      const path01 = [{collection: 'c01', id: 'i01'}];
      const onValue = fake();
      let unsubscribe: Unsubscribe;
      it('can subscribe', async () => {
        unsubscribe = await backend.subscribeValue(path01, onValue);
      });

      it('can update', async () => {
        await backend.update(path01, {foo: 'bar'});
      });

      it('calls callback', () => {
        assert(onValue.called);
        assert.deepEqual(onValue.lastCall.args, ['i01', {foo: 'bar'}]);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });

      it('can update', async () => {
        onValue.resetHistory();
        await backend.update(path01, {foo: 'baz'});
      });

      it('does not calls callback', async () => {
        assert.isFalse(onValue.called);
      });

      it('can subscribe value again', async () => {
        unsubscribe = await backend.subscribeValue(path01, onValue);
      });

      it('calls callback', async () => {
        assert(onValue.called);
        assert.deepEqual(onValue.lastCall.args, ['i01', {foo: 'baz'}]);
        await unsubscribe();
      });
    });

    describe('nested collection', () => {
      const onValue = fake();
      let unsubscribe: Unsubscribe;
      it('can subscribe', async () => {
        unsubscribe = await backend.subscribeValue(
          [{collection: 'c02', id: 'i01'}, {collection: 'c02', id: 'i03'}],
          onValue,
        );
      });

      it('can update', async () => {
        await backend.update([{collection: 'c02', id: 'i01'}], {foo: 'bar'});
        await backend.update(
          [{collection: 'c02', id: 'i01'}, {collection: 'c02', id: 'i03'}],
          {foo: 'baz'},
        );
      });

      it('calls callback', async () => {
        assert(onValue.called);
        assert.deepEqual(onValue.lastCall.args, ['i03', {foo: 'baz'}]);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });

      it('can subscribe value again', async () => {
        onValue.resetHistory();
        unsubscribe = await backend.subscribeValue(
          [{collection: 'c02', id: 'i01'}, {collection: 'c02', id: 'i03'}],
          onValue,
        );
      });

      it('calls callback', async () => {
        assert(onValue.called);
        assert.deepEqual(onValue.lastCall.args, ['i03', {foo: 'baz'}]);
        await unsubscribe();
      });
    });
  });
});
