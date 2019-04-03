import merge from 'lodash/merge';
import EventEmitter from 'events';
import Backend, {
  ItemPath, Callback, CollectionPath, Unsubscribe,
} from './Backend';
import shortid = require('shortid');

type Event = 'value' | 'child_added' | 'child_changed' | 'child_removed'

/**
 * Encode path into string
 * @param {ItemPath | CollectionPath} path - Path to encode
 * @return {string} - Encoded path
 */
function encodePath(path: ItemPath | CollectionPath): string {
  if (Array.isArray(path)) {
    return path.map((e) => `${e.collection}/${e.id}`).join('/');
  } else if (path.parentPath.length === 0) return path.collection;
  return `${encodePath(path.parentPath)}/${path.collection}`;
}

/**
 * Encode path and event into string
 * @param {ItemPath | CollectionPath} path - Path to encode
 * @param {Event} event - Event
 * @return {string} - Encoded string
 */
function encodeEvent(path: ItemPath | CollectionPath, event: Event): string {
  return `${encodePath(path)}:${event}`;
}

/**
 * Get collection path of the item
 * @param {ItemPath} path - Path for item
 * @return {CollectionPath} - Path for collection
 */
function getCollectionPath(path: ItemPath): CollectionPath {
  const parentPath = path.slice(0, -1);
  const {collection} = path[path.length - 1];

  return {
    parentPath,
    collection,
  };
}

/**
 * Backend using in memory store
 */
export default class MemoryBackend extends Backend {
  private eventBus = new EventEmitter();
  private store: { [key: string]: object | undefined } = {};

  /**
   * Subscribe single item
   * @param {ItemPath} path - Path for item
   * @param {Callback} onValue - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public async subscribeValue(
    path: ItemPath,
    onValue: Callback,
  ): Promise<Unsubscribe> {
    const event = encodeEvent(path, 'value');
    this.eventBus.on(event, onValue);

    const value = this.store[encodePath(path)];
    if (value !== undefined) {
      onValue(path[path.length - 1].id, value);
    }

    return async () => {
      this.eventBus.off(event, onValue);
    };
  }

  /**
   * Subscribe child items
   * @param {CollectionPath} path - Path for collection
   * @param {Callback} onAdded - Callback
   * @param {Callback} onChanged - Callback
   * @param {Callback} onRemoved - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public async subscribeChildren(
    path: CollectionPath,
    onAdded: Callback,
    onChanged: Callback,
    onRemoved: Callback,
  ): Promise<Unsubscribe> {
    const pairs: [Event, Callback][] = [
      ['child_added', onAdded],
      ['child_changed', onChanged],
      ['child_removed', onRemoved],
    ];

    pairs.forEach(([event, callback]) => {
      this.eventBus.on(encodeEvent(path, event), callback);
    });

    const encodedPath = encodePath(path);
    Object.keys(this.store)
      .forEach((key) => {
        const match = key.match(new RegExp(`^${encodedPath}/([^/]+)$`));
        if (!match) return;
        const value = this.store[key];
        if (value !== undefined) onAdded(match[1], value);
      });

    return async () => {
      pairs.forEach(([event, callback]) => {
        this.eventBus.off(encodeEvent(path, event), callback);
      });
    };
  }

  /**
   * Update an item
   * @param {ItemPath} path - Path for item
   * @param {object} value - Value
   */
  public async update(path: ItemPath, value: object): Promise<void> {
    const {id} = path[path.length - 1];
    const encodedPath = encodePath(path);

    const oldValue = this.store[encodedPath];
    const newValue = oldValue === undefined ? value : merge(oldValue, value);
    this.store[encodedPath] = newValue;

    this.eventBus.emit(encodeEvent(path, 'value'), id, newValue);
    this.eventBus.emit(
      encodeEvent(
        getCollectionPath(path),
        oldValue === undefined ? 'child_added' : 'child_changed',
      ),
      id,
      newValue,
    );
  }

  /**
   * Add new item
   * @param {CollectionPath} path - Path of collection to add
   * @param {object} value - Value
   * @return {Promise<string>} - Added id
   */
  public async add(path: CollectionPath, value: object): Promise<string> {
    const id = shortid();
    const itemPath = [
      ...path.parentPath,
      {
        collection: path.collection,
        id,
      },
    ];
    await this.update(itemPath, value);
    return id;
  }

  /**
   * Remove item
   * @param {ItemPath} path - Path for item
   * @param {object} value - Value
   */
  public async remove(path: ItemPath): Promise<void> {
    const id = path[path.length-1].id;
    const value = this.store[encodePath(path)];
    delete this.store[encodePath(path)];

    this.eventBus.emit(
      encodeEvent(getCollectionPath(path), 'child_removed'),
      id,
      value,
    );
  }
}
