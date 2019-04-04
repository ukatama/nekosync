import {assert} from 'chai';
import {fake} from 'sinon';
import rules from '../tests/utilities/rules';
import MemoryBackend from './backend/MemoryBackend';
import {Unsubscribe} from './backend/Backend';
import Collection from './Collection';
import Document, {attribute, collection} from './Document';

describe('Collection', () => {
  class ChildDocument extends Document<{ baz: number }> {
    @attribute({required: true}) baz!: number;
  }

  class TestDocument extends Document<{ foo: string; bar?: number }> {
    @attribute({required: true}) foo!: string;
    @attribute() bar?: number;

    @collection(
      ChildDocument,
      'nekord-test-value-nested-collection-2',
    ) child!: Collection<ChildDocument>;
  }

  const backend = new MemoryBackend(rules);
  let collection1: Collection<TestDocument>;
  it('can initialize', () => {
    collection1 = new Collection(
      TestDocument,
      backend,
      'nekord-test-value-nested-collection-1',
    );
  });

  const onUpdate = fake();
  const onRemove = fake();
  let unsubscribe: Unsubscribe;
  it('can subscribe document', async () => {
    unsubscribe = await collection1.subscribeDocument('1', onUpdate, onRemove);
  });

  it('calls callback', () => {
    assert(onRemove.called);
    onRemove.resetHistory();
    assert.isFalse(onUpdate.called);
  });

  it('can update', async () => {
    await collection1.update('1', {foo: 'foo', bar: 1});
  });

  let document: TestDocument;
  it('calls callback', () => {
    assert(onUpdate.called);
    document = onUpdate.lastCall.args[0];
    assert.equal(document.id, '1');
    assert.equal(document.foo, 'foo');
    assert.equal(document.bar, 1);
    onUpdate.resetHistory();
    assert.isFalse(onUpdate.called);
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });

  it('can subscribe document again', async () => {
    unsubscribe = await collection1.subscribeDocument('1', onUpdate, onRemove);
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    document = onUpdate.lastCall.args[0];
    assert.equal(document.id, '1');
    assert.equal(document.foo, 'foo');
    assert.equal(document.bar, 1);
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can update', async () => {
    document.update({foo: 'fooo', bar: 3});
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    document = onUpdate.lastCall.args[0];
    assert.equal(document.id, '1');
    assert.equal(document.foo, 'fooo');
    assert.equal(document.bar, 3);
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can remove', async () => {
    document.remove();
  });

  it('calls callback', () => {
    assert(onRemove.called);
    assert.deepEqual(onRemove.lastCall.args, ['1']);
    onRemove.resetHistory();
    assert.isFalse(onUpdate.called);
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });

  it('can subscribe collection', async () => {
    unsubscribe = await collection1.subscribeCollection(onUpdate, onRemove);
  });

  it('does not call callback', () => {
    assert.isFalse(onRemove.called);
    assert.isFalse(onUpdate.called);
  });

  it('can add', async () => {
    document = await collection1.add({foo: 'foo'});
  });

  it('returns document', () => {
    assert.isDefined(document.id);
    assert.equal(document.foo, 'foo');
    assert.isUndefined(document.bar);
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    const doc = onUpdate.lastCall.args[0];
    assert.equal(doc.id, document.id);
    assert.equal(doc.foo, 'foo');
    assert.isUndefined(doc.bar);
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });

  it('can subscribe collection again', async () => {
    unsubscribe = await collection1.subscribeCollection(onUpdate, onRemove);
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    const doc = onUpdate.lastCall.args[0];
    assert.equal(doc.id, document.id);
    assert.equal(doc.foo, 'foo');
    assert.isUndefined(doc.bar);
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can update', async () => {
    await document.update({bar: 5});
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    const doc = onUpdate.lastCall.args[0];
    assert.equal(doc.id, document.id);
    assert.equal(doc.foo, 'foo');
    assert.equal(doc.bar, 5);
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can remove', async () => {
    await document.remove();
  });

  it('calls callback', () => {
    assert(onRemove.called);
    assert.deepEqual(onRemove.lastCall.args, [document.id]);
    onRemove.resetHistory();
    assert.isFalse(onUpdate.called);
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });

  let collection2: Collection<ChildDocument>;
  it('can get chlid collection', async () => {
    document = await collection1.add({foo: 'f'});
    collection2 = document.child;
    assert.instanceOf(collection2, Collection);
  });

  it('can subscribe child collection', async () => {
    unsubscribe = await collection2.subscribeCollection(onUpdate, onRemove);
  });

  it('does not call callback', () => {
    assert.isFalse(onRemove.called);
    assert.isFalse(onUpdate.called);
  });

  let document2: ChildDocument;
  it('can add', async () => {
    document2 = await collection2.add({baz: 1});
  });

  it('returns document', () => {
    assert.isDefined(document2.id);
    assert.equal(document2.baz, 1);
  });

  it('calls callback', () => {
    assert(onUpdate.called);
    const doc = onUpdate.lastCall.args[0];
    assert.equal(doc.id, document2.id);
    assert.equal(doc.baz, 1);
    onUpdate.resetHistory();
    assert.isFalse(onRemove.called);
  });

  it('can remove', async () => {
    await document2.remove();
  });

  it('can unsubscribe', async () => {
    await unsubscribe();
  });
});
