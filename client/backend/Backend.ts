export type Unsubscribe = () => Promise<void>;
export type Callback = (id: string, value: object | undefined) => void;

export interface PathElement {
  collection: string;
  id: string;
}
export type DocumentPath = PathElement[];
export interface CollectionPath {
  parentPath: DocumentPath;
  collection: string;
}

/** Abstract class of any backends */
export default abstract class Backend {
  /**
   * Subscribe an document
   * @param {DocumentPath} path - Path for document
   * @param {Callback} callback - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public abstract subscribeDocument(
    path: DocumentPath,
    callback: Callback,
  ): Promise<Unsubscribe>;

  /**
   * Subscribe child documents
   * @param {CollectionPath} path - Path for collection
   * @param {Callback} callback - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public abstract subscribeCollection(
    path: CollectionPath,
    callback: Callback,
  ): Promise<Unsubscribe>;

  /**
   * Update an document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   */
  public abstract update(path: DocumentPath, value: object): Promise<void>;

  /**
   * Add new document
   * @param {CollectionPath} path - Path of collection to add
   * @param {object} value - Value
   * @return {Promise<string>} - Added id
   */
  public abstract add(path: CollectionPath, value: object): Promise<string>;

  /**
   * Remove document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   */
  public abstract remove(path: DocumentPath): Promise<void>;
}
