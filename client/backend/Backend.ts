export type Unsubscribe = () => Promise<void>;
export type Callback = (id: string, value: object) => void;

export interface PathElement {
  collection: string;
  id: string;
}
export type ItemPath = PathElement[];
export interface CollectionPath {
  parentPath: ItemPath;
  collection: string;
}

/** Abstract class of any backends */
export default abstract class Backend {
  /**
   * Subscribe an item
   * @param {ItemPath} path - Path for item
   * @param {Callback} onValue - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public abstract subscribeValue(
    path: ItemPath,
    onValue: Callback,
  ): Promise<Unsubscribe>;

  /**
   * Subscribe child items
   * @param {CollectionPath} path - Path for collection
   * @param {Callback} onAdded - Callback
   * @param {Callback} onChanged - Callback
   * @param {Callback} onRemoved - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public abstract subscribeChildren(
    path: CollectionPath,
    onAdded: Callback,
    onChanged: Callback,
    onRemoved: Callback,
  ): Promise<Unsubscribe>;

  /**
   * Update an item
   * @param {ItemPath} path - Path for item
   * @param {object} value - Value
   */
  public abstract update(path: ItemPath, value: object): Promise<void>;

  /**
   * Add new item
   * @param {CollectionPath} path - Path of collection to add
   * @param {object} value - Value
   * @return {Promise<string>} - Added id
   */
  public abstract add(path: CollectionPath, value: object): Promise<string>;

  /**
   * Remove item
   * @param {ItemPath} path - Path for item
   * @param {object} value - Value
   */
  public abstract remove(path: ItemPath): Promise<void>;
}
