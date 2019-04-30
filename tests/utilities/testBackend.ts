import { assert } from 'chai';
import _ from 'lodash';
import shortid from 'shortid';
import { fake } from 'sinon';
import Backend, { Unsubscribe } from '../../client/backend/Backend';
import { ForbiddenError } from '../../client/backend/BackendError';
import {
  EmptyPathError,
  DocumentPath,
  getId,
  getDocumentPath,
} from '../../common/Path';
import cleaner from './collectionCleaner';

const collectionA = 'nekosync-test-a';
const collectionB = 'nekosync-test-b';
const collectionC = 'nekosync-test-c';
const collectionD = 'nekosync-test-d';
const collectionX = 'nekosync-test-x';

function getParentPath(nested: boolean): DocumentPath {
  return nested ? [{ collection: collectionB, id: shortid() }] : [];
}

function teestDocument(backend: Backend, nested: boolean): void {
  after(cleaner(backend, collectionA));
  if (nested) after(cleaner(backend, collectionB));

  let unsubscribe: Unsubscribe;

  const callback = fake();
  const parentPath = getParentPath(nested);
  const documentPath = [
    ...parentPath,
    { collection: collectionA, id: shortid() },
  ];
  const id = getId(documentPath);

  it('can subscribe document', async () => {
    unsubscribe = await backend.subscribeDocument(documentPath, callback);
  });

  it('can update', async () => {
    if (nested) await backend.update(parentPath, { foo: 'bar' });
    await backend.update(documentPath, { foo: 'foo' });
  });

  it('calls callback', async () => {
    assert(callback.called);
    assert.deepEqual(callback.lastCall.args, [id, { foo: 'foo' }]);
    callback.resetHistory();
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });

  it('can subscribe again', async () => {
    unsubscribe = await backend.subscribeDocument(documentPath, callback);
  });

  it('calls callback', async () => {
    assert(callback.called);
    assert.deepEqual(callback.lastCall.args, [id, { foo: 'foo' }]);
    callback.resetHistory();
  });

  it('can remove', async () => {
    await backend.remove(documentPath);
  });

  it('calls callback', async () => {
    assert(callback.called);
    assert.deepEqual(callback.lastCall.args, [id, undefined]);
    callback.resetHistory();
  });

  if (nested) {
    it('can remove', async () => {
      await backend.remove(parentPath);
    });
  }

  it('can unsubscribe', async () => {
    await unsubscribe();
  });
}

function testCollection(backend: Backend, nested: boolean): void {
  after(cleaner(backend, collectionA));
  if (nested) after(cleaner(backend, collectionB));

  let unsubscribe: Unsubscribe;

  const callback = fake();
  const parentPath = getParentPath(nested);
  const collectionPath = {
    parentPath,
    collection: collectionA,
  };

  it('can subscribe', async () => {
    unsubscribe = await backend.subscribeCollection(collectionPath, callback);
  });

  let id: string;
  it('can add item', async () => {
    if (nested) await backend.update(parentPath, { baz: 1 });
    id = await backend.add(collectionPath, { foo: 'bar' });
  });

  it('calls callback', () => {
    assert(callback.called);
    assert.deepEqual(callback.lastCall.args, [id, { foo: 'bar' }]);
    callback.resetHistory();
  });

  let documentPath: DocumentPath;
  it('can update item', async () => {
    documentPath = getDocumentPath(collectionPath, id);
    await backend.update(documentPath, { foo: 'baz' });
  });

  it('can get item', async () => {
    const value = await backend.get(documentPath);
    assert.deepEqual(value, { foo: 'baz' });
  });

  it('calls callback', () => {
    assert(callback.called);
    assert.deepEqual(callback.lastCall.args, [id, { foo: 'baz' }]);
    callback.resetHistory();
  });

  it('can remove item', async () => {
    await backend.remove(documentPath);
  });

  it('calls callback', () => {
    assert.deepEqual(callback.lastCall.args, [id, undefined]);
    callback.resetHistory();
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });

  const ids: string[] = [];
  it('can add item', async () => {
    ids.push(await backend.add(collectionPath, { foo: 'a' }));
    ids.push(await backend.add(collectionPath, { foo: 'b' }));
    ids.push(await backend.add(collectionPath, { foo: 'c' }));
  });

  it('can list item', async () => {
    const value = await backend.list(collectionPath);
    assert.deepEqual(
      _.sortBy(value, a => a[0]),
      _.sortBy(
        [
          [ids[0], { foo: 'a' }],
          [ids[1], { foo: 'b' }],
          [ids[2], { foo: 'c' }],
        ],
        a => a[0],
      ),
    );
  });

  it('can subscribe again', async () => {
    unsubscribe = await backend.subscribeCollection(collectionPath, callback);
  });

  it('calls callback', async () => {
    assert(callback.called);
    const receivedIds = callback.getCalls().map(call => call.args[0]);
    assert.deepEqual(_.uniq(receivedIds.sort()), ids.slice().sort());
    callback.resetHistory();
  });

  it('can remove', async () => {
    await Promise.all(
      ids.map(id => backend.remove(getDocumentPath(collectionPath, id))),
    );
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });

  if (nested) {
    it('can remove', async () => {
      await backend.remove(parentPath);
    });
  }
}

function testError(backend: Backend): void {
  describe('error', () => {
    describe('ForbiddenError', () => {
      const collection = collectionX;
      const id = shortid();
      it('throws in update', () => {
        return assert.isRejected(
          backend.update([{ collection, id }], { foo: 'bar' }),
          ForbiddenError,
        );
      });

      it('throws in add', () => {
        return assert.isRejected(
          backend.add({ parentPath: [], collection }, { foo: 'bar' }),
          ForbiddenError,
        );
      });

      it('throws in remove', () => {
        return assert.isRejected(
          backend.remove([{ collection, id }]),
          ForbiddenError,
        );
      });

      it('throws in subscribeDocument', () => {
        return assert.isRejected(
          backend.subscribeDocument([{ collection, id }], fake()),
          ForbiddenError,
        );
      });

      it('throws in subscribeCollection', () => {
        return assert.isRejected(
          backend.subscribeCollection({ parentPath: [], collection }, fake()),
          ForbiddenError,
        );
      });
    });

    describe('EmptyPathError', () => {
      it('throws in update', () => {
        return assert.isRejected(
          backend.update([], { foo: 'bar' }),
          EmptyPathError,
        );
      });
    });
  });
}

function testRules(backend: Backend): void {
  describe('conditional rule', () => {
    after(cleaner(backend, collectionD));
    after(cleaner(backend, collectionC));

    const id = shortid();
    it('can update', async () => {
      await backend.update([{ collection: collectionD, id }], {
        writable: true,
      });
      await backend.update([{ collection: collectionC, id }], { c: 'c' });
    });

    it('can not update', async () => {
      await backend.update([{ collection: collectionD, id }], {
        writable: false,
      });
      await assert.isRejected(
        backend.update([{ collection: collectionC, id }], { c: 'cc' }),
        ForbiddenError,
      );
    });

    it('can not write', async () => {
      await backend.remove([{ collection: collectionD, id }]);
      await assert.isRejected(
        backend.update([{ collection: collectionC, id }], { c: 'cc' }),
        ForbiddenError,
      );
      await assert.isRejected(
        backend.remove([{ collection: collectionC, id }]),
        ForbiddenError,
      );
    });

    it('can remove', async () => {
      await backend.update([{ collection: collectionD, id }], {
        writable: true,
      });
      await backend.remove([{ collection: collectionC, id }]);
      await backend.remove([{ collection: collectionD, id }]);
    });
  });
}

function testFile(backend: Backend): void {
  describe('files', () => {
    after(cleaner(backend, collectionA));

    const value = 'test'.split('').map(c => c.charCodeAt(0));
    const data = new ArrayBuffer(value.length);
    const view = new Uint8Array(data);
    view.set(value);

    const name = 'test.txt';
    const type = 'text/plain';

    let id: string;
    it('adds file', async () => {
      id = await backend.addFile(
        {
          parentPath: [],
          collection: collectionA,
        },
        {
          data,
          name,
          type,
        },
      );
    });

    it('returns file url', async () => {
      const url = await backend.getFileUrl([
        {
          collection: collectionA,
          id,
        },
      ]);
      assert.isString(url);
      assert.notEqual(url, '');
    });

    it('has list of files', async () => {
      const list = await backend.list({
        parentPath: [],
        collection: collectionA,
      });
      assert.deepEqual(list.map(a => a[1]), [
        { name: 'test.txt', type: 'text/plain' },
      ]);
    });

    it('deletes file', async () => {
      await backend.deleteFile([
        {
          collection: collectionA,
          id,
        },
      ]);
    });
  });
}

export default function testBackend(backend: Backend): void {
  describe('document subscription', () => {
    teestDocument(backend, false);
    describe('nested', () => {
      teestDocument(backend, true);
    });
  });

  describe('collection subscription', () => {
    testCollection(backend, false);
    describe('nested', () => {
      testCollection(backend, true);
    });
  });

  testError(backend);
  testRules(backend);
  testFile(backend);
}
