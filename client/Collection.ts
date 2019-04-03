import Backend, {Unsubscribe, Callback} from './backend/Backend';
import Model from './Model';

/** Collection to access data */
export default abstract class Collection {
  private backend: Backend;

  public parent: Model | null;

  /**
   * Constructor
   * @param {Backend} backend - Backend instance
   * @param {Model | null} parent - Parent item
   */
  public constructor(backend: Backend, parent: Model | null = null) {
    this.backend = backend;
    this.parent = parent;
  }

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
      this.parent,
      id,
      onValue,
    );
    return unsubscribe;
  }

  /**
   * Subscribe child items
   * @param {string} id - Item id
   * @param {Callback} onAdded - Callback
   * @param {Callback} onChanged - Callback
   * @param {Callback} onMoved - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public async subscribeChildren(
    id: string,
    onAdded: Callback,
    onChanged: Callback,
    onMoved: Callback,
  ): Promise<Unsubscribe> {
    const unsubscribe = await this.backend.subscribeChildren(
      this.parent,
      id,
      onAdded,
      onChanged,
      onMoved,
    );
    return unsubscribe;
  }
}
