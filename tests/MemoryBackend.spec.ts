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

  describe('children', () => {
    describe('simple collection', () => {
      const onAdded = fake();
      const onChanged = fake();
      const onRemoved = fake();
      let unsubscribe: Unsubscribe;
      it('can subscribe', async () => {
        unsubscribe = await backend.subscribeChildren(
          {parentPath: [], collection: 'c03'},
          onAdded,
          onChanged,
          onRemoved,
        );
      });

      let id: string;
      it('can add item', async () => {
        id = await backend.add(
          {parentPath: [], collection: 'c03'},
          {foo: 'bar'},
        );
      });

      it('calls callback', () => {
        assert(onAdded.called);
        assert.deepEqual(onAdded.lastCall.args, [id, {foo: 'bar'}]);
        onAdded.resetHistory();

        assert.isFalse(onChanged.called);
        assert.isFalse(onRemoved.called);
      });

      it('can update item', async () => {
        await backend.update([{collection: 'c03', id}], {foo: 'baz'});
      });

      it('calls callback', () => {
        assert(onChanged.called);
        assert.deepEqual(onChanged.lastCall.args, [id, {foo: 'baz'}]);
        onChanged.resetHistory();

        assert.isFalse(onAdded.called);
        assert.isFalse(onRemoved.called);
      });

      it('can remove item', async () => {
        await backend.remove([{collection: 'c03', id}]);
      });

      it('calls callback', () => {
        assert(onRemoved.called);
        assert.deepEqual(onRemoved.lastCall.args, [id, {foo: 'baz'}]);
        onRemoved.resetHistory();

        assert.isFalse(onAdded.called);
        assert.isFalse(onChanged.called);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });

      it('can add item', async () => {
        await backend.add(
          {parentPath: [], collection: 'c03'},
          {foo: 'a'},
        );
        await backend.add(
          {parentPath: [], collection: 'c03'},
          {foo: 'b'},
        );
        await backend.add(
          {parentPath: [], collection: 'c03'},
          {foo: 'c'},
        );
      });

      it('can subscribe again', async () => {
        unsubscribe = await backend.subscribeChildren(
          {parentPath: [], collection: 'c03'},
          onAdded,
          onChanged,
          onRemoved,
        );
      });

      it('calls callback', () => {
        assert(onAdded.called);
        assert.equal(onAdded.getCalls().length, 3);
        onAdded.resetHistory();

        assert.isFalse(onChanged.called);
        assert.isFalse(onRemoved.called);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });
    });

    describe('nested collection', () => {
      const parentPath = [
        {collection: 'c04', id: 'i05'},
      ];
      const onAdded = fake();
      const onChanged = fake();
      const onRemoved = fake();
      let unsubscribe: Unsubscribe;
      it('can subscribe', async () => {
        await backend.update(parentPath, {bar: 'bar'});
        unsubscribe = await backend.subscribeChildren(
          {parentPath, collection: 'c07'},
          onAdded,
          onChanged,
          onRemoved,
        );
      });

      let id: string;
      it('can add item', async () => {
        id = await backend.add(
          {parentPath, collection: 'c07'},
          {foo: 'bar'},
        );
      });

      it('calls callback', () => {
        assert(onAdded.called);
        assert.deepEqual(onAdded.lastCall.args, [id, {foo: 'bar'}]);
        onAdded.resetHistory();

        assert.isFalse(onChanged.called);
        assert.isFalse(onRemoved.called);
      });

      it('can update item', async () => {
        await backend.update(
          [...parentPath, {collection: 'c07', id}],
          {foo: 'baz'},
        );
      });

      it('calls callback', () => {
        assert(onChanged.called);
        assert.deepEqual(onChanged.lastCall.args, [id, {foo: 'baz'}]);
        onChanged.resetHistory();

        assert.isFalse(onAdded.called);
        assert.isFalse(onRemoved.called);
      });

      it('can remove item', async () => {
        await backend.remove([...parentPath, {collection: 'c07', id}]);
      });

      it('calls callback', () => {
        assert(onRemoved.called);
        assert.deepEqual(onRemoved.lastCall.args, [id, {foo: 'baz'}]);
        onRemoved.resetHistory();

        assert.isFalse(onAdded.called);
        assert.isFalse(onChanged.called);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });

      it('can add item', async () => {
        await backend.add(
          {parentPath, collection: 'c07'},
          {foo: 'a'},
        );
        await backend.add(
          {parentPath, collection: 'c07'},
          {foo: 'b'},
        );
        await backend.add(
          {parentPath, collection: 'c07'},
          {foo: 'c'},
        );
      });

      it('can subscribe again', async () => {
        unsubscribe = await backend.subscribeChildren(
          {parentPath, collection: 'c07'},
          onAdded,
          onChanged,
          onRemoved,
        );
      });

      it('calls callback', () => {
        assert(onAdded.called);
        assert.equal(onAdded.getCalls().length, 3);
        onAdded.resetHistory();

        assert.isFalse(onChanged.called);
        assert.isFalse(onRemoved.called);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });
    });
  });
});
