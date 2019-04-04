import {CollectionPath, DocumentPath} from '../../common/Path';

/**
 * DataStore
 */
export default abstract class DataStore {
  /**
   * Get an document
   * @param {DocumentPath} path - Path for document
   * @return {object | undefined} value - Value
   */
  public abstract get(path: DocumentPath): Promise<object | undefined>;

  /**
   * Get an document
   * @param {CollectionPath} path - Path for collection
   * @return {{ id: string, value: object }[]} value - Values
   */
  public abstract list(
    path: CollectionPath,
  ): Promise<{ id: string; value: object }[]>;

  /**
   * Update an document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   * @return {object} - Updated value
   */
  public abstract update(path: DocumentPath, value: object): Promise<object>;

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
