import {assert} from 'chai';
import MemoryBackend from './backend/MemoryBackend';
import Document, {
  attribute, MissingAttributeError,
} from './Document';

describe('Document', () => {
  class TestDocument extends Document<{
    foo: string;
    bar: string;
    baz?: number;
  }> {
    @attribute({required: true}) public foo!: string;
    @attribute({required: true}) public bar!: string;
    @attribute() public baz?: number;
  }

  const backend = new MemoryBackend([]);
  const path = [{collection: 'c1', id: 'i1'}];
  let document: TestDocument;
  it('can initialize', () => {
    document = new TestDocument(
      backend,
      path,
      {foo: 'foo', bar: 'bar', baz: 0},
    );
  });

  it('initialized', () => {
    assert.equal(document.id, 'i1');
    assert.equal(document.foo, 'foo');
    assert.equal(document.bar, 'bar');
    assert.equal(document.baz, 0);
  });

  it('can initialize with empty value', () => {
    document = new TestDocument(
      backend,
      path,
      {foo: 'foofoo', bar: 'barbar'},
    );
  });

  it('initialized', () => {
    assert.equal(document.foo, 'foofoo');
    assert.equal(document.bar, 'barbar');
    assert.isUndefined(document.baz);
  });

  it('throws on initializing with missing attribute', () => {
    assert.throws(
      () => document = new TestDocument(backend, path, {foo: 'foo', baz: 0}),
      MissingAttributeError,
    );
  });
});
