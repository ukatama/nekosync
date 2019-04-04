import merge from 'lodash/merge';
import shortid from 'shortid';
import Datastore from './Datastore';
import {
  DocumentPath, encodePath, getDocumentPath, CollectionPath,
} from '../../common/Path';

/**
 * Datastore using on memory data store
 */
export default class MemoryDatastore extends Datastore {
  private store: {[key: string]: object | undefined} = {};

  /**
   * Get an document
   * @param {DocumentPath} path - Path for document
   * @return {object | undefined} value - Value
   */
  public async get(path: DocumentPath): Promise<object | undefined> {
    return this.store[encodePath(path)];
  }

  /**
   * Get an document
   * @param {CollectionPath} path - Path for collection
   * @return {{ id: string, value: object }[]} value - Values
   */
  public async list(
    path: CollectionPath,
  ): Promise<{ id: string; value: object }[]> {
    const encodedPath = encodePath(path);
    return Object.keys(this.store)
      .map((key) => {
        const m = key.match(new RegExp(`^${encodedPath}/([^/]+)$`));
        if (!m) return null;
        return {
          id: m[1],
          value: this.store[key],
        };
      })
      .filter((a) => a) as { id: string; value: object }[];
  }

  /**
   * Update an document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   * @return {object} - Updated value
   */
  public async update(path: DocumentPath, value: object): Promise<object> {
    const encodedPath = encodePath(path);
    const oldValue = this.store[encodedPath];
    const newValue = oldValue === undefined ? value : merge(oldValue, value);
    this.store[encodedPath] = newValue;
    return newValue;
  }

  /**
   * Add new document
   * @param {CollectionPath} path - Path of collection to add
   * @param {object} value - Value
   * @return {Promise<string>} - Added id
   */
  public async add(path: CollectionPath, value: object): Promise<string> {
    const id = shortid();
    const documentPath = getDocumentPath(path, id);
    await this.update(documentPath, value);
    return id;
  }

  /**
   * Remove document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   */
  public async remove(path: DocumentPath): Promise<void> {
    const encodedPath = encodePath(path);
    delete this.store[encodedPath];
  }
}
