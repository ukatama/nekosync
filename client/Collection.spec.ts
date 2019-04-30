import Collection from './Collection';
import MemoryBackend from './backend/MemoryBackend';
import rules from '../tests/utilities/rules';
import { assert } from 'chai';
import Document from './Document';
import { Unsubscribe } from './backend/Backend';

interface A {
  foo: string;
  bar?: number;
}

describe('Collection', () => {
  function test(nested: boolean) {
    class CollectionA extends Collection<A> {
      public get name(): string {
        return 'nekosync-test-a';
      }
    }
    class CollectionB extends Collection<{}> {
      public get name(): string {
        return 'nekosync-test-b';
      }
    }

    let collectionA: CollectionA;
    let collectionB: CollectionB;
    it('initializes', async () => {
      const backend = new MemoryBackend(rules);
      collectionB = new CollectionB(backend);
      const parentDocument = nested ? await collectionB.add({}) : undefined;
      collectionA = new CollectionA(backend, parentDocument);
    });

    it('adds new document', async () => {
      const newDocument = await collectionA.add({
        foo: 'foo',
        bar: 1,
      });
      assert.isString(newDocument.id);
      assert.deepEqual(newDocument.value, {
        foo: 'foo',
        bar: 1,
      });
    });

    it('lists documents', async () => {
      const list = await collectionA.list();
      assert.deepEqual(list.map(d => d.value), [
        {
          foo: 'foo',
          bar: 1,
        },
      ]);
    });

    let unsubscribe: Unsubscribe;
    it('subscribes', async () => {
      unsubscribe = await collectionA.subscribe();
    });

    it('syncs documents', () => {
      const documents = collectionA.documents;
      assert.deepEqual(documents.map(d => d.value), [
        {
          foo: 'foo',
          bar: 1,
        },
      ]);
    });

    let addedDocument: Document<A>;
    it('adds new document', async () => {
      addedDocument = await collectionA.add({
        foo: 'foooo',
      });
    });

    it('syncs documents', () => {
      const documents = collectionA.documents;
      assert.deepEqual(documents.map(d => d.value), [
        {
          foo: 'foooo',
        },
        {
          foo: 'foo',
          bar: 1,
        },
      ]);
    });

    it('updates document', async () => {
      await addedDocument.update({
        bar: 2,
      });
    });

    it('syncs documents', () => {
      const documents = collectionA.documents;
      assert.deepEqual(documents.map(d => d.value), [
        {
          foo: 'foooo',
          bar: 2,
        },
        {
          foo: 'foo',
          bar: 1,
        },
      ]);
    });

    it('removes document', async () => {
      await addedDocument.remove();
    });

    it('syncs documents', () => {
      const documents = collectionA.documents;
      assert.deepEqual(documents.map(d => d.value), [
        {
          foo: 'foo',
          bar: 1,
        },
      ]);
    });

    it('unsubscribes', async () => {
      await unsubscribe();
    });
  }

  test(false);
  describe('nested', () => {
    test(true);
  });
});
