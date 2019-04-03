import Backend, {Unsubscribe} from './backend/Backend';
import Model from './Model';

export type Callback = (model: Model) => void;

/**
 * Wrap callback
 * @param {Ctor} Ctor - Model class
 * @param {Callback} callback - Callback function to wrap
 * @return {Function} - Wrapped callback
 */
function wrapCallback(
  Ctor: { new(id: string): Model},
  callback: Callback,
): (id: string, value: object) => void {
  return (id: string, value: object) => {
    callback(Object.assign(new Ctor(id), value));
  };
}

/** Collection to access data */
export default abstract class Collection {
  private ModelCtor: { new(id: string): Model };
  private backend: Backend;
  public parent: Model | null;

  /**
   * Constructor
   * @param {Ctor} ModelCtor - Model class
   * @param {Backend} backend - Backend instance
   * @param {Model | null} parent - Parent item
   */
  public constructor(
    ModelCtor: { new(id: string): Model },
    backend: Backend,
    parent: Model | null = null,
  ) {
    this.ModelCtor = ModelCtor;
    this.backend = backend;
    this.parent = parent;
  }

  public abstract get name(): string;

  /**
   * Subscribe single item
   * @param {string} id - Item id
   * @param {Callback} onValue - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public async subscribeValue(
    id: string,
    onValue: Callback,
  ): Promise<Unsubscribe> {
    const unsubscribe = await this.backend.subscribeValue(
      [{collection: this.name, id}],
      wrapCallback(this.ModelCtor, onValue),
    );
    return unsubscribe;
  }

  /**
   * Subscribe child items
   * @param {Callback} onAdded - Callback
   * @param {Callback} onChanged - Callback
   * @param {Callback} onRemoved - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public async subscribeChildren(
    onAdded: Callback,
    onChanged: Callback,
    onRemoved: Callback,
  ): Promise<Unsubscribe> {
    const unsubscribe = await this.backend.subscribeChildren(
      {parentPath: [], collection: this.name},
      wrapCallback(this.ModelCtor, onAdded),
      wrapCallback(this.ModelCtor, onChanged),
      wrapCallback(this.ModelCtor, onRemoved),
    );
    return unsubscribe;
  }
}
