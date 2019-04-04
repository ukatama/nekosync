import uniq from 'lodash/uniq';
import {assert} from 'chai';
import shortid from 'shortid';
import {fake} from 'sinon';
import Backend, {Unsubscribe} from '../../client/backend/Backend';

function getCollectionName(): string {
  return `test-${Date.now()}-${shortid()}`;
}

export default function testBackend(backend: Backend) {
  describe('value', () => {
    describe('simple collection', () => {
      const c01 = getCollectionName();

      const path01 = [{collection: c01, id: 'i01'}];
      const callback = fake();
      let unsubscribe: Unsubscribe;
      it('can subscribe', async () => {
        unsubscribe = await backend.subscribeDocument(path01, callback);
      });

      it('can update', async () => {
        await backend.update(path01, {foo: 'bar'});
      });

      it('calls callback', () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, ['i01', {foo: 'bar'}]);
        callback.resetHistory();
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });

      it('can update', async () => {
        await backend.update(path01, {foo: 'baz'});
      });

      it('does not calls callback', async () => {
        assert.isFalse(callback.called);
      });

      it('can subscribe value again', async () => {
        unsubscribe = await backend.subscribeDocument(path01, callback);
      });

      it('calls callback', async () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, ['i01', {foo: 'baz'}]);
        callback.resetHistory();
      });

      it('can remove', async () => {
        await backend.remove(path01);
      });

      it('calls callback', async () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, ['i01', undefined]);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });
    });

    describe('nested collection', () => {
      const callback = fake();
      let unsubscribe: Unsubscribe;
      const c02 = getCollectionName();
      it('can subscribe', async () => {
        unsubscribe = await backend.subscribeDocument(
          [{collection: c02, id: 'i01'}, {collection: c02, id: 'i03'}],
          callback,
        );
      });

      it('can update', async () => {
        await backend.update([{collection: c02, id: 'i01'}], {foo: 'bar'});
        await backend.update(
          [{collection: c02, id: 'i01'}, {collection: c02, id: 'i03'}],
          {foo: 'baz'},
        );
      });

      it('calls callback', async () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, ['i03', {foo: 'baz'}]);
        callback.resetHistory();
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });

      it('can subscribe value again', async () => {
        unsubscribe = await backend.subscribeDocument(
          [{collection: c02, id: 'i01'}, {collection: c02, id: 'i03'}],
          callback,
        );
      });

      it('calls callback', async () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, ['i03', {foo: 'baz'}]);
        callback.resetHistory();
        await unsubscribe();
      });
    });
  });

  describe('children', () => {
    describe('simple collection', () => {
      const callback = fake();
      let unsubscribe: Unsubscribe;
      const c03 = getCollectionName();
      it('can subscribe', async () => {
        unsubscribe = await backend.subscribeCollection(
          {parentPath: [], collection: c03},
          callback,
        );
      });

      let id: string;
      it('can add item', async () => {
        id = await backend.add(
          {parentPath: [], collection: c03},
          {foo: 'bar'},
        );
      });

      it('calls callback', () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id, {foo: 'bar'}]);
        callback.resetHistory();
      });

      it('can update item', async () => {
        await backend.update([{collection: c03, id}], {foo: 'baz'});
      });

      it('calls callback', () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id, {foo: 'baz'}]);
        callback.resetHistory();
      });

      it('can remove item', async () => {
        await backend.remove([{collection: c03, id}]);
      });

      it('calls callback', () => {
        assert.deepEqual(callback.lastCall.args, [id, undefined]);
        callback.resetHistory();
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });

      let id1: string;
      let id2: string;
      let id3: string;
      it('can add item', async () => {
        id1 = await backend.add(
          {parentPath: [], collection: c03},
          {foo: 'a'},
        );
        id2 = await backend.add(
          {parentPath: [], collection: c03},
          {foo: 'b'},
        );
        id3 = await backend.add(
          {parentPath: [], collection: c03},
          {foo: 'c'},
        );
      });

      it('can subscribe again', async () => {
        unsubscribe = await backend.subscribeCollection(
          {parentPath: [], collection: c03},
          callback,
        );
      });

      it('calls callback', async () => {
        assert(callback.called);
        const ids = callback.getCalls().map((call) => call.args[0]).sort();
        assert.deepEqual(uniq(ids), [id1, id2, id3].sort());
        callback.resetHistory();
      });

      it('can remove', async () => {
        await backend.remove([{collection: c03, id: id1}]);
        await backend.remove([{collection: c03, id: id2}]);
        await backend.remove([{collection: c03, id: id3}]);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });
    });

    describe('nested collection', () => {
      const c04 = getCollectionName();
      const c07 = getCollectionName();
      const parentPath = [
        {collection: c04, id: 'i05'},
      ];
      const callback = fake();
      let unsubscribe: Unsubscribe;
      it('can subscribe', async () => {
        await backend.update(parentPath, {bar: 'bar'});
        unsubscribe = await backend.subscribeCollection(
          {parentPath, collection: c07},
          callback,
        );
      });

      let id: string;
      it('can add item', async () => {
        id = await backend.add(
          {parentPath, collection: c07},
          {foo: 'bar'},
        );
      });

      it('calls callback', () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id, {foo: 'bar'}]);
        callback.resetHistory();
      });

      it('can update item', async () => {
        await backend.update(
          [...parentPath, {collection: c07, id}],
          {foo: 'baz'},
        );
      });

      it('calls callback', () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id, {foo: 'baz'}]);
        callback.resetHistory();
      });

      it('can remove item', async () => {
        await backend.remove([...parentPath, {collection: c07, id}]);
      });

      it('calls callback', () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id, undefined]);
        callback.resetHistory();
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });

      let id1: string;
      let id2: string;
      let id3: string;
      it('can add item', async () => {
        id1 = await backend.add(
          {parentPath, collection: c07},
          {foo: 'a'},
        );
        id2 = await backend.add(
          {parentPath, collection: c07},
          {foo: 'b'},
        );
        id3 = await backend.add(
          {parentPath, collection: c07},
          {foo: 'c'},
        );
      });

      it('can subscribe again', async () => {
        unsubscribe = await backend.subscribeCollection(
          {parentPath, collection: c07},
          callback,
        );
      });

      it('calls callback', () => {
        assert(callback.called);
        const ids = callback.getCalls().map((call) => call.args[0]).sort();
        assert.deepEqual(uniq(ids), [id1, id2, id3].sort());
        callback.resetHistory();
      });

      it('can remove', async () => {
        await backend.remove([...parentPath, {collection: c07, id: id1}]);
        await backend.remove([...parentPath, {collection: c07, id: id2}]);
        await backend.remove([...parentPath, {collection: c07, id: id3}]);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });
    });
  });
}
