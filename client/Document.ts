import Collection from './Collection';
import { DocumentPath, getDocumentPath } from '../common/Path';
import { Unsubscribe } from './backend/Backend';
import DocumentRemovedError from './DocumentRemovedError';

/**
 * Document
 */
export default class Document<T extends object> {
  public readonly collection: Collection<T>;
  public readonly id: string;
  private _value: T | undefined;

  /**
   * Constructor
   * @param {Collection} collection - Parent collection
   * @param {string} id - ID of document
   * @param {T} value - Value of document
   */
  public constructor(collection: Collection<T>, id: string, value?: T) {
    this.collection = collection;
    this.id = id;
    this._value = value;
  }

  /**
   * Get path for document
   * @return {DocumentPath} path
   */
  public get path(): DocumentPath {
    return getDocumentPath(this.collection.path, this.id);
  }

  /**
   * Get synced value of document
   */
  public get value(): T {
    if (this._value === undefined) throw new DocumentRemovedError();
    return this._value;
  }

  /**
   * Get value of document
   * @param value G
   */

  /**
   * Update document
   * @param {T} value - New value
   */
  public async update(value: Partial<T>): Promise<void> {
    await this.collection.backend.update(this.path, value);
  }

  /**
   * Remove document
   */
  public async remove(): Promise<void> {
    await this.collection.backend.remove(this.path);
  }

  /**
   * Subscribe document
   */
  public async subscribe(): Promise<Unsubscribe> {
    return await this.collection.backend.subscribeDocument(
      this.path,
      (id, value) => {
        this._value = value as T | undefined;
      },
    );
  }
}
