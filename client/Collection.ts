import Backend, { Unsubscribe } from './backend/Backend';
import { CollectionPath } from '../common/Path';
import Document from './Document';

/**
 * Collection
 */
export default abstract class Collection<
  T extends object,
  U extends object = object
> {
  private _documents: Document<T>[] = [];
  public readonly backend: Backend;
  public readonly parentDocument?: Document<U>;

  public abstract get name(): string;

  /**
   * Constructor
   * @param {Backend} backend - Instance of backend
   * @param {Document | undefined} parentDocument - Parent document
   */
  public constructor(backend: Backend, parentDocument?: Document<U>) {
    this.backend = backend;
    this.parentDocument = parentDocument;
  }

  /**
   * Get path of collection
   * @return {CollectionPath} Path
   */
  public get path(): CollectionPath {
    return {
      parentPath: this.parentDocument ? this.parentDocument.path : [],
      collection: this.name,
    };
  }

  /**
   * List documents
   * @return {Promise<Document<T>[]>} Documents
   */
  public async list(): Promise<Document<T>[]> {
    const values = await this.backend.list(this.path);
    return values.map(([id, value]) => new Document<T>(this, id, value as T));
  }

  /**
   * Add new document
   * @param {T} value - Value of new document
   */
  public async add(value: T): Promise<Document<T>> {
    const id = await this.backend.add(this.path, value);
    return new Document<T>(this, id, value);
  }

  /**
   * Get documents subscribed
   * @return {Document<T>[]} documents
   */
  public get documents(): Document<T>[] {
    return this._documents;
  }

  /**
   * Subscribe
   */
  public async subscribe(): Promise<Unsubscribe> {
    this._documents = [];

    return await this.backend.subscribeCollection(this.path, (id, value) => {
      if (value === undefined) {
        this._documents = this._documents.filter(
          document => document.id !== id,
        );
      } else {
        let exists = false;
        const newDocument = new Document<T>(this, id, value as T);
        this._documents = this._documents.map(document => {
          if (document.id === id) {
            exists = true;
            return newDocument;
          }
          return document;
        });

        if (!exists) this._documents.unshift(newDocument);
      }
    });
  }
}
