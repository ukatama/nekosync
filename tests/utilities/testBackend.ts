import uniq from 'lodash/uniq';
import chai, {assert} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import shortid from 'shortid';
import {fake} from 'sinon';
import Backend, {Unsubscribe} from '../../client/backend/Backend';
import {ForbiddenError} from '../../client/backend/BackendError';

chai.use(chaiAsPromised);

export default function testBackend(backend: Backend) {
  describe('value', () => {
    describe('simple collection', () => {
      const collection = 'nekodb-test-value-simple-collection';
      const id = shortid();

      const path = [{collection, id}];
      const callback = fake();
      let unsubscribe: Unsubscribe;
      it('can subscribe', async () => {
        unsubscribe = await backend.subscribeDocument(path, callback);
      });

      it('can update', async () => {
        await backend.update(path, {foo: 'bar'});
      });

      it('calls callback', () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id, {foo: 'bar'}]);
        callback.resetHistory();
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });

      it('can update', async () => {
        await backend.update(path, {foo: 'baz'});
      });

      it('does not calls callback', async () => {
        assert.isFalse(callback.called);
      });

      it('can subscribe value again', async () => {
        unsubscribe = await backend.subscribeDocument(path, callback);
      });

      it('calls callback', async () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id, {foo: 'baz'}]);
        callback.resetHistory();
      });

      it('can remove', async () => {
        await backend.remove(path);
      });

      it('calls callback', async () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id, undefined]);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });
    });

    describe('nested collection', () => {
      const callback = fake();
      let unsubscribe: Unsubscribe;
      const collection1 = 'nekodb-test-value-nested-collection-1';
      const id1 = shortid();
      const parentPath = [{collection: collection1, id: id1}]
      const collection2 = 'nekodb-test-value-nested-collection-2';
      const id2 = shortid();
      const itemPath = [
        ...parentPath,
        {collection: collection2, id: id2},
      ];
      it('can subscribe', async () => {
        unsubscribe = await backend.subscribeDocument(
          itemPath,
          callback,
        );
      });

      it('can update', async () => {
        await backend.update(parentPath, {foo: 'bar'});
        await backend.update(
          itemPath,
          {foo: 'baz'},
        );
      });

      it('calls callback', async () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id2, {foo: 'baz'}]);
        callback.resetHistory();
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });

      it('can subscribe value again', async () => {
        unsubscribe = await backend.subscribeDocument(
          itemPath,
          callback,
        );
      });

      it('calls callback', async () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id2, {foo: 'baz'}]);
        callback.resetHistory();
        await unsubscribe();
      });

      it('can remove', async () => {
        await backend.remove(itemPath);
        await backend.remove(parentPath);
      });
    });
  });

  describe('children', () => {
    describe('simple collection', () => {
      const callback = fake();
      let unsubscribe: Unsubscribe;
      const collection = 'nekodb-test-children-simple-collection';
      it('can subscribe', async () => {
        unsubscribe = await backend.subscribeCollection(
          {parentPath: [], collection},
          callback,
        );
      });

      let id: string;
      it('can add item', async () => {
        id = await backend.add(
          {parentPath: [], collection},
          {foo: 'bar'},
        );
      });

      it('calls callback', () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id, {foo: 'bar'}]);
        callback.resetHistory();
      });

      it('can update item', async () => {
        await backend.update([{collection, id}], {foo: 'baz'});
      });

      it('calls callback', () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id, {foo: 'baz'}]);
        callback.resetHistory();
      });

      it('can remove item', async () => {
        await backend.remove([{collection, id}]);
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
          {parentPath: [], collection},
          {foo: 'a'},
        );
        id2 = await backend.add(
          {parentPath: [], collection},
          {foo: 'b'},
        );
        id3 = await backend.add(
          {parentPath: [], collection},
          {foo: 'c'},
        );
      });

      it('can subscribe again', async () => {
        unsubscribe = await backend.subscribeCollection(
          {parentPath: [], collection},
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
        await backend.remove([{collection, id: id1}]);
        await backend.remove([{collection, id: id2}]);
        await backend.remove([{collection, id: id3}]);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });
    });

    describe('nested collection', () => {
      const collection1 = 'nekodb-test-children-nested-collection-1';
      const collection2 = 'nekodb-test-children-nested-collection-2';
      const id4 = shortid();
      const parentPath = [
        {collection: collection1, id: id4},
      ];
      const collectionPath = {parentPath, collection: collection2};
      const callback = fake();
      let unsubscribe: Unsubscribe;
      it('can subscribe', async () => {
        await backend.update(parentPath, {bar: 'bar'});
        unsubscribe = await backend.subscribeCollection(
          collectionPath,
          callback,
        );
      });

      let id: string;
      it('can add item', async () => {
        id = await backend.add(
          collectionPath,
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
          [...parentPath, {collection: collection2, id}],
          {foo: 'baz'},
        );
      });

      it('calls callback', () => {
        assert(callback.called);
        assert.deepEqual(callback.lastCall.args, [id, {foo: 'baz'}]);
        callback.resetHistory();
      });

      it('can remove item', async () => {
        await backend.remove([...parentPath, {collection: collection2, id}]);
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
          collectionPath,
          {foo: 'a'},
        );
        id2 = await backend.add(
          collectionPath,
          {foo: 'b'},
        );
        id3 = await backend.add(
          collectionPath,
          {foo: 'c'},
        );
      });

      it('can subscribe again', async () => {
        unsubscribe = await backend.subscribeCollection(
          collectionPath,
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
        await backend.remove(
          [...parentPath, {collection: collection2, id: id1}],
        );
        await backend.remove(
          [...parentPath, {collection: collection2, id: id2}],
        );
        await backend.remove(
          [...parentPath, {collection: collection2, id: id3}],
        );
        await backend.remove(parentPath);
      });

      it('can unsubscribe', async () => {
        await unsubscribe();
      });
    });
  });

  describe('ForbiddenError', () => {
    const collection = 'nekodb-test-forbidden-collection';
    const id = shortid();
    it('throws in update', () => {
      return assert.isRejected(
        backend.update([{collection, id}], {foo: 'bar'}),
        ForbiddenError,
      );
    });

    it('throws in add', () => {
      return assert.isRejected(
        backend.add({parentPath: [], collection}, {foo: 'bar'}),
        ForbiddenError,
      );
    });

    it('throws in remove', () => {
      return assert.isRejected(
        backend.remove([{collection, id}]),
        ForbiddenError,
      );
    });

    it('throws in subscribeDocument', () => {
      return assert.isRejected(
        backend.subscribeDocument([{collection, id}], fake()),
        ForbiddenError,
      );
    });

    it('throws in subscribeCollection', () => {
      return assert.isRejected(
        backend.subscribeCollection({parentPath: [], collection}, fake()),
        ForbiddenError,
      );
    });
  });
}
