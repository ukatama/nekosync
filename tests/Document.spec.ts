import {assert} from 'chai';
import Document, {attribute, MissingAttributeError} from '../client/Document';

describe('Document', () => {
  interface TestAttributes {
    foo: string;
    bar: string;
    baz?: number;
  }

  class TestDocument extends Document<TestAttributes> {
    @attribute({required: true}) public foo!: string;
    @attribute({required: true}) public bar!: string;
    @attribute() public baz?: number;
  }

  let document: TestDocument;
  it('can initialize', () => {
    document = new TestDocument('id', {foo: 'foo', bar: 'bar', baz: 0});
  });

  it('initialized', () => {
    assert.equal(document.foo, 'foo');
    assert.equal(document.bar, 'bar');
    assert.equal(document.baz, 0);
  });

  it('can initialize with empty value', () => {
    document = new TestDocument('id', {foo: 'foofoo', bar: 'barbar'});
  });

  it('initialized', () => {
    assert.equal(document.foo, 'foofoo');
    assert.equal(document.bar, 'barbar');
    assert.isUndefined(document.baz);
  });

  it('throws on initializing with missing attribute', () => {
    assert.throws(
      () => document = new TestDocument('id', {foo: 'foo', baz: 0}),
      MissingAttributeError,
    );
  })
});
