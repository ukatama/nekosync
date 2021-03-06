import { initializeApp, firestore, app, storage } from 'firebase';
import 'firebase/firestore';
import 'firebase/storage';
import {
  CollectionPath,
  DocumentPath,
  EmptyPathError,
  encodePath,
  getDocumentPath,
} from '../../common/Path';
import Backend, { Callback, Unsubscribe, AddFileParams } from './Backend';
import { ForbiddenError } from './BackendError';

// ToDo: Detect document removed event
const Removed = 'NEKORD_REMOVED';

/**
 * Handle error
 * @param {Function} block - block
 * @return {Promise<T>} - Returl value
 */
async function handleError<T>(block: () => Promise<T>): Promise<T> {
  try {
    const result = await block();
    return result;
  } catch (e) {
    if (e.name === 'FirebaseError' && e.code === 'permission-denied') {
      throw new ForbiddenError();
    } else {
      throw e;
    }
  }
}

/**
 * Filter value
 * @param {object | undefined} value - Value to filter
 * @return {object | undefined} - Filtered value
 */
function filter(value: object | undefined): object | undefined {
  if (value === undefined) return value;
  else if (
    Removed in value &&
    (value as { [Removed]?: typeof Removed })[Removed]
  ) {
    return undefined;
  }
  return value;
}

/**
 * Get reference of document from path
 * @param {Firestore} firestore - Instance of firestore
 * @param {DocumentPath} path - Path to parse
 * @return {firestore.DocumentReference} - Reference of document
 */
function getDocument(
  firestore: firestore.Firestore,
  path: DocumentPath,
): firestore.DocumentReference {
  if (path.length === 0) throw new EmptyPathError();

  const [first, ...otherPath] = path;
  const document = firestore.collection(first.collection).doc(first.id);
  return otherPath.reduce(
    (p, c) => p.collection(c.collection).doc(c.id),
    document,
  );
}

/**
 * Get reference of collection from path
 * @param {Firestore} firestore - Instance of firestore
 * @param {CollectionPath} path - Path to parse
 * @return {firestore.CollectionReference} - Reference of document
 */
function getCollection(
  firestore: firestore.Firestore,
  path: CollectionPath,
): firestore.CollectionReference {
  const { parentPath, collection } = path;
  if (parentPath.length === 0) return firestore.collection(collection);

  const parent = getDocument(firestore, parentPath);
  return parent.collection(collection);
}

/**
 * Backend using in Firebase Cloud Firestore
 */
export default class FirebaseBackend extends Backend {
  public app: app.App;

  /**
   * Constructor
   * @param {object} options - Options to initialize firebase app
   * @param {string} name - Name of firebase app
   */
  public constructor(options: object, name?: string) {
    super();

    this.app = initializeApp(options, name);
  }

  /**
   * Getter of firestore instance
   * @return {Firestore} - Firestore instance
   */
  private get firestore(): firestore.Firestore {
    return this.app.firestore();
  }

  /**
   * Getter of firestore instance
   * @return {Storage} - Firestore instance
   */
  private get storage(): storage.Storage {
    return this.app.storage();
  }

  /**
   * Subscribe an document
   * @param {DocumentPath} path - Path for document
   * @param {Callback} callback - Callback
   * @return {Unsubscribe} Function to unsubscribe
   */
  public async subscribeDocument(
    path: DocumentPath,
    callback: Callback,
  ): Promise<Unsubscribe> {
    return await handleError(async () => {
      const document = getDocument(this.firestore, path);
      const snapshot = await document.get();

      const unsubscribe = document.onSnapshot(snapshot =>
        callback(snapshot.id, filter(snapshot.data())),
      );

      callback(snapshot.id, snapshot.data());

      return async () => {
        unsubscribe();
      };
    });
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
    return await handleError(async () => {
      const collection = getCollection(this.firestore, path);
      const snapshot = await collection.get();

      const unsubscribe = collection.onSnapshot(snapshot =>
        snapshot.forEach(result => callback(result.id, filter(result.data()))),
      );

      snapshot.forEach(result => callback(result.id, filter(result.data())));

      return async () => {
        unsubscribe();
      };
    });
  }

  /**
   * Get a value of document
   * @param {DocumentPath} path - Path for document
   * @return {object} Value
   */
  public async get(path: DocumentPath): Promise<object | undefined> {
    const snapshot = await handleError(async () => {
      const document = getDocument(this.firestore, path);
      return await document.get();
    });
    return snapshot.data();
  }

  /**
   * List values of collection
   * @param {CollectionPath} path - Path for collection
   * @return {[string, object][]} Values
   */
  public async list(path: CollectionPath): Promise<[string, object][]> {
    const snapshot = await handleError(async () => {
      const collection = getCollection(this.firestore, path);
      return await collection.get();
    });
    return snapshot.docs.map(s => [s.id, s.data()]);
  }

  /**
   * Update an document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   */
  public async update(path: DocumentPath, value: object): Promise<void> {
    await handleError(async () => {
      const document = getDocument(this.firestore, path);
      await document.set(value, {
        merge: true,
      });
    });
  }

  /**
   * Add new document
   * @param {CollectionPath} path - Path of collection to add
   * @param {object} value - Value
   * @return {Promise<string>} - Added id
   */
  public async add(path: CollectionPath, value: object): Promise<string> {
    return await handleError(async () => {
      const collection = getCollection(this.firestore, path);
      const ref = await collection.add(value);
      return ref.id;
    });
  }

  /**
   * Remove document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   */
  public async remove(path: DocumentPath): Promise<void> {
    await handleError(async () => {
      const document = getDocument(this.firestore, path);
      await document.set({ [Removed]: true });
      await document.delete();
    });
  }

  /**
   * Put file
   * @param {DocumentPath} path - Path for file
   * @param {AddFileParams} params - Params
   * @return {string} File id
   */
  public async addFile(
    path: CollectionPath,
    { data, type, name }: AddFileParams,
  ): Promise<string> {
    const id = await this.add(path, { type, name });
    const ref = this.storage.ref(encodePath(getDocumentPath(path, id)));
    await ref.put(data, { contentType: type });
    return id;
  }

  /**
   * Delete file
   * @param {DocumentPath} path - Path for file
   */
  public async deleteFile(path: DocumentPath): Promise<void> {
    const ref = this.storage.ref(encodePath(path));
    await ref.delete();
    await this.remove(path);
  }

  /**
   * Get file url
   * @param {DocumentPath} path - Path for file
   * @return {string} URL
   */
  public async getFileUrl(path: DocumentPath): Promise<string> {
    const ref = this.storage.ref(encodePath(path));
    return ref.getDownloadURL();
  }
}
