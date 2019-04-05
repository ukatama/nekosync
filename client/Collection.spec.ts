import {assert} from 'chai';
import shortid from 'shortid';
import {fake} from 'sinon';
import rules from '../tests/utilities/rules';
import MemoryBackend from './backend/MemoryBackend';
import {Unsubscribe} from './backend/Backend';
import Collection from './Collection';
import Document, {attribute, collection} from './Document';

const CollectionA = 'nekord-test-a';
const CollectionB = 'nekord-test-b';

describe('Collection', () => {
  class DocumentA extends Document<{a1: string; a2?: number}> {
    @attribute({required: true}) public a1!: string;
    @attribute() public a2?: number;
  }

  class DocumentB extends Document<{b1: string}> {
    @attribute({required: true}) public b1!: string;

    @collection(
      DocumentA,
      CollectionA,
    ) public child!: Collection<DocumentA>
  }

  const backend = new MemoryBackend(rules);
  let collectionA: Collection<DocumentA>;
  let collectionB: Collection<DocumentB>;
  it('can initialize', () => {
    collectionA = new Collection(DocumentA, backend, CollectionA);
    collectionB = new Collection(DocumentB, backend, CollectionB);
  });

  const id = shortid();
  const onUpdate = fake();
  const onRemove = fake();
  let unsubscribe: Unsubscribe;
  it('can subscribe document', async () => {
    unsubscribe = await collectionA.subscribeDocument(id, onUpdate, onRemove);
  });

  it('calls callback', () => {
    assert(onRemove.called);
    onRemove.resetHistory();
    assert.isFalse(onUpdate.called);
  });

  it('can update', async () => {
    await collectionA.update(id, {a1: 'foo', a2: 1});
  });

  let documentA: DocumentA;
  it('calls callback', () => {
    assert(onUpdate.called);
    documentA = onUpdate.lastCall.args[0];
    assert.equal(documentA.id, id);
    assert.equal(documentA.a1, 'foo');
    assert.equal(documentA.a2, 1);
    onUpdate.resetHistory();
    assert.isFalse(onUpdate.called);
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });

  it('can subscribe document again', async () => {
    unsubscribe = await collectionA.subscribeDocument(id, onUpdate, onRemove);
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    documentA = onUpdate.lastCall.args[0];
    assert.equal(documentA.id, id);
    assert.equal(documentA.a1, 'foo');
    assert.equal(documentA.a2, 1);
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can update', async () => {
    documentA.update({a1: 'fooo', a2: 3});
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    documentA = onUpdate.lastCall.args[0];
    assert.equal(documentA.id, id);
    assert.equal(documentA.a1, 'fooo');
    assert.equal(documentA.a2, 3);
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can remove', async () => {
    documentA.remove();
  });

  it('calls callback', () => {
    assert(onRemove.called);
    assert.deepEqual(onRemove.lastCall.args, [id]);
    onRemove.resetHistory();
    assert.isFalse(onUpdate.called);
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });

  it('can subscribe collection', async () => {
    unsubscribe = await collectionA.subscribeCollection(onUpdate, onRemove);
  });

  it('does not call callback', () => {
    assert.isFalse(onRemove.called);
    assert.isFalse(onUpdate.called);
  });

  it('can add', async () => {
    documentA = await collectionA.add({a1: 'foo'});
  });

  it('returns document', () => {
    assert.isDefined(documentA.id);
    assert.equal(documentA.a1, 'foo');
    assert.isUndefined(documentA.a2);
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    const doc = onUpdate.lastCall.args[0];
    assert.equal(doc.id, documentA.id);
    assert.equal(doc.a1, 'foo');
    assert.isUndefined(doc.a2);
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });

  it('can subscribe collection again', async () => {
    unsubscribe = await collectionA.subscribeCollection(onUpdate, onRemove);
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    const doc = onUpdate.lastCall.args[0];
    assert.equal(doc.id, documentA.id);
    assert.equal(doc.a1, 'foo');
    assert.isUndefined(doc.a2);
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can update', async () => {
    await documentA.update({a2: 5});
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    const doc = onUpdate.lastCall.args[0];
    assert.equal(doc.id, documentA.id);
    assert.equal(doc.a1, 'foo');
    assert.equal(doc.a2, 5);
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can remove', async () => {
    await documentA.remove();
  });

  it('calls callback', () => {
    assert(onRemove.called);
    assert.deepEqual(onRemove.lastCall.args, [documentA.id]);
    onRemove.resetHistory();
    assert.isFalse(onUpdate.called);
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });

  let documentB: DocumentB;
  it('can get chlid collection', async () => {
    documentB = await collectionB.add({b1: 'f'});
    collectionA = documentB.child;
    assert.instanceOf(collectionA, Collection);
  });

  it('can subscribe child collection', async () => {
    unsubscribe = await collectionA.subscribeCollection(onUpdate, onRemove);
  });

  it('does not call callback', () => {
    assert.isFalse(onRemove.called);
    assert.isFalse(onUpdate.called);
  });

  it('can add', async () => {
    documentA = await collectionA.add({a1: 'baz'});
  });

  it('returns document', () => {
    assert.isDefined(documentA.id);
    assert.equal(documentA.a1, 'baz');
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    const doc = onUpdate.lastCall.args[0];
    assert.equal(doc.id, documentA.id);
    assert.equal(doc.a1, 'baz');
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can remove', async () => {
    await documentA.remove();
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });
});
