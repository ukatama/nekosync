import {assert} from 'chai';
import Model, {attribute, MissingAttributeError} from '../client/Model';

describe('Model', () => {
  interface TestAttributes1 {
    foo: string;
    bar: string;
    baz?: number;
  }

  class TestModel1 extends Model<TestAttributes1> {
    @attribute({required: true}) public foo!: string;
    @attribute({required: true}) public bar!: string;
    @attribute() public baz?: number;
  }

  let model1: TestModel1;
  it('can initialize', () => {
    model1 = new TestModel1('id', {foo: 'foo', bar: 'bar', baz: 0});
  });

  it('initialized', () => {
    assert.equal(model1.foo, 'foo');
    assert.equal(model1.bar, 'bar');
    assert.equal(model1.baz, 0);
  });

  it('can initialize with empty value', () => {
    model1 = new TestModel1('id', {foo: 'foofoo', bar: 'barbar'});
  });

  it('initialized', () => {
    assert.equal(model1.foo, 'foofoo');
    assert.equal(model1.bar, 'barbar');
    assert.isUndefined(model1.baz);
  });

  it('throws on initializing with missing attribute', () => {
    assert.throws(
      () => model1 = new TestModel1('id', {foo: 'foo', baz: 0}),
      MissingAttributeError,
    );
  })
});
