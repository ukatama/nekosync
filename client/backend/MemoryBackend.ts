import merge from 'lodash/merge';
import EventEmitter from 'events';
import shortid from 'shortid';
import {
  CollectionPath,
  DocumentPath,
  encodePath,
  getCollectionPath,
  getDocumentPath,
  getId,
} from '../../common/Path';
import Rule, {CompiledRule, compile, authorize} from '../../common/Rule';
import Backend, {Callback, Unsubscribe} from './Backend';
import {ForbiddenError} from './BackendError';

const UserId = `user-${shortid()}`;

/**
 * Backend using in memory store
 */
export default class MemoryBackend extends Backend {
  private eventBus = new EventEmitter();
  private store: { [key: string]: object | undefined } = {};
  private rules: CompiledRule[];

  /**
   * Constructor
   * @param {Rules} rules - Rules
   */
  public constructor(rules: Rule[]) {
    super();
    this.rules = compile(rules);
  }

  /**
   * Get value
   * @param path - Path for collection
   * @return {object | undefined} - Value
   */
  public get(path: DocumentPath): object | undefined {
    return this.store[encodePath(path)];
  }

  /**
   * List values
   * @param {CollectionPath} path - Path for collection
   * @return{[string, object][]} - Array of [id, value]
   */
  public list(path: CollectionPath): [string, object][] {
    const encodedPath = encodePath(path);
    return Object.keys(this.store)
      .map((key) => {
        const match = key.match(new RegExp(`^${encodedPath}/([^/]+)$`));
        if (!match) return undefined;
        return [match[1], this.store[key]];
      })
      .filter(a => a !== undefined) as [string, object][];
  }

  /**
   * Authorize path by rule
   * @param {DocumentPath | CollectionPath} path - Path
   * @param {'read' | 'write'} mode - Mode to access
   */
  private async authorize(
    path: DocumentPath | CollectionPath,
    mode: 'read' | 'write',
  ): Promise<void> {
    const result = await authorize(path, this.rules, mode, {
      get: async (path) => this.get(path),
      list: async (path) => this.list(path).map(a => a[1]),
      async getUserId() {
        return UserId;
      },
    });
    if (!result) throw new ForbiddenError();
  }

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
    await this.authorize(path, 'read');

    const encodedPath = encodePath(path);
    this.eventBus.on(encodedPath, callback);

    const value = this.get(path);
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
    await this.authorize(path, 'read');

    const encodedPath = encodePath(path);
    this.eventBus.on(encodedPath, callback);

    const values = this.list(path);
    values.forEach(([id, value]) => {
      callback(id, value);
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
    await this.authorize(path, 'write');

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
    await this.authorize(getDocumentPath(path, id), 'write');
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
    await this.authorize(path, 'write');

    const id = path[path.length-1].id;
    const encodedPath = encodePath(path);
    delete this.store[encodedPath];

    this.eventBus.emit(encodedPath, id, undefined);
    this.eventBus.emit(encodePath(getCollectionPath(path)), id, undefined);
  }
}
