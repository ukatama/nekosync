import Backend, { Unsubscribe } from './backend/Backend';
import { CollectionPath } from '../common/Path';
import Document from './Document';

/**
 * Collection
 */
export default abstract class Collection<
  T extends object,
  D extends Document<T> = Document<T>,
  P extends Document<{}> = Document<{}>
> {
  private _documents: D[] = [];
  public readonly backend: Backend;
  public readonly parentDocument?: P;

  public abstract get name(): string;

  /**
   * Constructor
   * @param {Backend} backend - Instance of backend
   * @param {Document | undefined} parentDocument - Parent document
   */
  public constructor(backend: Backend, parentDocument?: P) {
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
   * Create document instance
   * @param {string} id - ID
   * @param {T | undefined} value - Value
   * @return {D} Document
   */
  public createDocument(id: string, value?: T): D {
    return new Document<T>(this, id, value) as D;
  }

  /**
   * List documents
   * @return {Promise<D[]>} Documents
   */
  public async list(): Promise<D[]> {
    const values = await this.backend.list(this.path);
    return values.map(([id, value]) => this.createDocument(id, value as T));
  }

  /**
   * Add new document
   * @param {T} value - Value of new document
   */
  public async add(value: T): Promise<D> {
    const id = await this.backend.add(this.path, value);
    return this.createDocument(id, value);
  }

  /**
   * Get documents subscribed
   * @return {D[]} documents
   */
  public get documents(): D[] {
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
        const newDocument = this.createDocument(id, value as T);
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
