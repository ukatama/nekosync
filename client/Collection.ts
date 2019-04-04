import {DocumentPath, getDocumentPath} from '../common/Path';
import Backend, {Unsubscribe} from './backend/Backend';
import Document, {AttributesOf, DocumentClassOf} from './Document';

export type UpdateCallback<D> = (document: D) => void;
export type RemoveCallback = (id: string) => void;

/**
 * Collection
 */
export default class Collection<D> {
  private DocumentClass: DocumentClassOf<D>;
  private backend: Backend;
  private parentPath: DocumentPath;
  public readonly name: string;

  /**
   * Constructor
   * @param {DocumentClassOf<D>} DocumentClass: Constructor of Document
   * @param {Backend} backend - Instance of Backend
   * @param {string} name - Name of collection
   * @param {DocumentPath} parentPath - Path for parent document
   */
  public constructor(
    DocumentClass: DocumentClassOf<D>,
    backend: Backend,
    name: string,
    parentPath: DocumentPath = [],
  ) {
    this.DocumentClass = DocumentClass,
    this.backend = backend;
    this.name = name;
    this.parentPath = parentPath;
  }

  /**
   * Subscribe document
   * @param {string} id - Document id
   * @param {UpdateCallback} onUpdate - Callback for update
   * @param {RemoveCallback} onRemove - Callback for remove
   * @param {Promise<Unsubscribe>} - Unsubscriber
   */
  public async subscribeDocument(
    id: string,
    onUpdate: UpdateCallback<D>,
    onRemove: RemoveCallback,
  ): Promise<Unsubscribe> {
    const path = [...this.parentPath, {collection: this.name, id}];
    const unsubscribe = await this.backend.subscribeDocument(
      path,
      (id, value) => {
        if (value === undefined) onRemove(id);
        else onUpdate(new this.DocumentClass(this.backend, path, value));
      },
    );
    return unsubscribe;
  }

  /**
   * Subscribe collection
   * @param {UpdateCallback} onUpdate - Callback for update
   * @param {RemoveCallback} onRemove - Callback for remove
   * @param {Promise<Unsubscribe>} - Unsubscriber
   */
  public async subscribeCollection(
    onUpdate: UpdateCallback<D>,
    onRemove: RemoveCallback,
  ): Promise<Unsubscribe> {
    const path = {parentPath: this.parentPath, collection: this.name};
    const unsubscribe = await this.backend.subscribeCollection(
      path,
      (id, value) => {
        if (value === undefined) onRemove(id);
        else {
          onUpdate(
            new this.DocumentClass(
              this.backend,
              getDocumentPath(path, id),
              value,
            ),
          );
        }
      },
    );
    return unsubscribe;
  }

  /**
   * Update
   * @param {string} id - id
   * @param {object} value - value
   */
  public async update(id: string, value: Partial<AttributesOf<D>>): Promise<void> {
    await this.backend.update(
      [...this.parentPath, {collection: this.name, id}],
      value,
    );
  }

  /**
   * Add
   * @param {object} value - value
   */
  public async add(value: AttributesOf<D>): Promise<D> {
    const id = await this.backend.add(
      {parentPath: this.parentPath, collection: this.name},
      value,
    );
    return new this.DocumentClass(
      this.backend,
      [...this.parentPath, {collection: this.name, id}],
      value,
    );
  }
}
