import { DocumentPath, CollectionPath } from '../../common/Path';

export type Unsubscribe = () => Promise<void>;
export type Callback = (id: string, value: object | undefined) => void;

export interface AddFileParams {
  data: ArrayBuffer;
  name: string;
  type: string;
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
   * Get a value of document
   * @param {DocumentPath} path - Path for document
   * @return {object | undefined} Value
   */
  public abstract get(path: DocumentPath): Promise<object | undefined>;

  /**
   * List values of collection
   * @param {CollectionPath} path - Path for collection
   * @return {[string, object][]} Values
   */
  public abstract list(path: CollectionPath): Promise<[string, object][]>;

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

  /**
   * Put file
   * @param {CollectionPath} path - Path for file
   * @param {AddFileParams} params - Params
   * @return {string} File id
   */
  public abstract addFile(
    path: CollectionPath,
    params: AddFileParams,
  ): Promise<string>;

  /**
   * Delete file
   * @param {DocumentPath} path - Path for file
   */
  public abstract deleteFile(path: DocumentPath): Promise<void>;

  /**
   * Get file url
   * @param {DocumentPath} path - Path for file
   * @return {string} URL
   */
  public abstract getFileUrl(path: DocumentPath): Promise<string>;
}
