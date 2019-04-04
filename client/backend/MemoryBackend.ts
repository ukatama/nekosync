import merge from 'lodash/merge';
import EventEmitter from 'events';
import Backend, {Callback, Unsubscribe} from './Backend';
import shortid = require('shortid');
import {
  encodePath, getCollectionPath, DocumentPath, CollectionPath, getId,
} from '../../common/Path';

type Event = 'value' | 'child_added' | 'child_changed' | 'child_removed'

/**
 * Backend using in memory store
 */
export default class MemoryBackend extends Backend {
  private eventBus = new EventEmitter();
  private store: { [key: string]: object | undefined } = {};

  /**
   * Subscribe single document
   * @param {DocumentPath} path - Path for document
   * @param {Callback} callback - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public async subscribeDocument(
    path: DocumentPath,
    callback: Callback,
  ): Promise<Unsubscribe> {
    const encodedPath = encodePath(path);
    this.eventBus.on(encodedPath, callback);

    const value = this.store[encodedPath];
    callback(getId(path), value);

    return async () => {
      this.eventBus.off(encodedPath, callback);
    };
  }

  /**
   * Subscribe child documents
   * @param {CollectionPath} path - Path for collection
   * @param {Callback} callback - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public async subscribeCollection(
    path: CollectionPath,
    callback: Callback,
  ): Promise<Unsubscribe> {
    const encodedPath = encodePath(path);
    this.eventBus.on(encodedPath, callback);

    Object.keys(this.store)
      .forEach((key) => {
        const match = key.match(new RegExp(`^${encodedPath}/([^/]+)$`));
        if (!match) return;
        const value = this.store[key];
        callback(match[1], value);
      });

    return async () => {
      this.eventBus.off(encodedPath, callback);
    };
  }

  /**
   * Update an document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   */
  public async update(path: DocumentPath, value: object): Promise<void> {
    const id = getId(path);
    const encodedPath = encodePath(path);

    const oldValue = this.store[encodedPath];
    const newValue = oldValue === undefined ? value : merge(oldValue, value);
    this.store[encodedPath] = newValue;

    this.eventBus.emit(encodedPath, id, newValue);
    this.eventBus.emit(encodePath(getCollectionPath(path)), id, newValue);
  }

  /**
   * Add new document
   * @param {CollectionPath} path - Path of collection to add
   * @param {object} value - Value
   * @return {Promise<string>} - Added id
   */
  public async add(path: CollectionPath, value: object): Promise<string> {
    const id = shortid();
    const documentPath = [
      ...path.parentPath,
      {
        collection: path.collection,
        id,
      },
    ];
    await this.update(documentPath, value);
    return id;
  }

  /**
   * Remove document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   */
  public async remove(path: DocumentPath): Promise<void> {
    const id = path[path.length-1].id;
    const encodedPath = encodePath(path);
    delete this.store[encodedPath];

    this.eventBus.emit(encodedPath, id, undefined);
    this.eventBus.emit(encodePath(getCollectionPath(path)), id, undefined);
  }
}
