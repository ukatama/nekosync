import merge from 'lodash/merge';
import omit from 'lodash/omit';
import {Collection, Db} from 'mongodb';
import shortid from 'shortid';
import {
  CollectionPath,
  DocumentPath,
  encodePath,
  getCollectionPath,
  getDocumentPath,
} from '../../common/Path';

/**
 * Datastore with MongoDB
 */
export default class MongoDatastore {
  private db: Db;

  /**
   * Constructor
   * @param {Db} db - Db instance
   */
  public constructor(db: Db) {
    this.db = db;
  }

  /**
   * Get collection
   * @param {CollectionPath} path - Path for collection
   * @return {Collection} - Collection
   */
  private getCollection(path: CollectionPath): Collection {
    return this.db.collection([
      ...path.parentPath.map((e) => e.collection),
      path.collection,
    ].join('/'));
  }

  /**
   * Get an document
   * @param {DocumentPath} path - Path for document
   * @return {object | undefined} value - Value
   */
  public async get(path: DocumentPath): Promise<object | undefined> {
    const collection = this.getCollection(getCollectionPath(path));
    const value = await collection.findOne(
      {path: encodePath(path)},
    );
    return omit(value, ['path', '_id']);
  }

  /**
   * Get an document
   * @param {CollectionPath} path - Path for collection
   * @return {{ id: string, value: object }[]} value - Values
   */
  public async list(
    path: CollectionPath,
  ): Promise<{ id: string; value: object }[]> {
    const collection = this.getCollection(path);
    const encodedPath = encodePath(path);
    const items = await collection.find(
      {path: {$regex: `^${encodedPath}/[^/]+$`}},
    ).toArray();
    return items.map(
      (value) => ({
        id: value.path.substr(encodedPath.length + 1),
        value: omit(value, ['path', '_id']),
      }),
    );
  }

  /**
   * Update an document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   * @return {object} - Updated value
   */
  public async update(path: DocumentPath, value: object): Promise<object> {
    const collection = this.getCollection(getCollectionPath(path));
    const oldValue = await this.get(path);
    const newValue = oldValue === undefined ? value : merge(oldValue, value);
    await collection.updateOne(
      {path: encodePath(path)},
      {$set: newValue},
      {upsert: true},
    );
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
    await this.update(getDocumentPath(path, id), value);
    return id;
  }

  /**
   * Remove document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   */
  public async remove(path: DocumentPath): Promise<void> {
    const collection = this.getCollection(getCollectionPath(path));
    await collection.deleteOne({path: encodePath(path)});
  }
}
