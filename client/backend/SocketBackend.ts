import shortid from 'shortid';
import {EventEmitter} from 'events';
import {DocumentPath, CollectionPath, encodePath} from '../../common/Path';
import Socket, {
  SocketUpstreamEvent,
  SocketDownstreamEvent,
  SocketRequestEvent,
  SocketErrorCode,
  ResponseMessage,
  SnapshotMessage,
  RequestMessage,
} from '../../common/Socket';
import Backend, {Callback, Unsubscribe, AddFileParams} from './Backend';
import {ForbiddenError} from './BackendError';

/**
 * Backend using socket.io
 */
export default class SocketBackend extends Backend {
  private socket: Socket;
  private requestEventBus: EventEmitter = new EventEmitter();
  private snapshotEventBus: EventEmitter = new EventEmitter();

  /**
   * Constructor
   * @param {Socket} socket - socket
   */
  public constructor(socket: Socket) {
    super();
    this.socket = socket;

    this.socket.on(
      SocketDownstreamEvent.Response,
      (message: ResponseMessage) => {
        this.requestEventBus.emit(message.requestId, message);
      },
    );

    this.socket.on(
      SocketDownstreamEvent.Snapshot,
      (message: SnapshotMessage) => {
        this.snapshotEventBus.emit(encodePath(message.path), message);
      },
    );
  }

  /**
   * Send asynchronous request
   * @param {SocketRequestEvent} event - Action type
   * @param {DocumentPath | CollectionPath} path - Path
   * @param {object | undefined} value - Value
   * @return {Promise<string | undefined>} - response
   */
  private request<T, U = void>(
    event: SocketRequestEvent,
    path: DocumentPath | CollectionPath,
    value?: object,
  ): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const requestId = shortid();

      this.requestEventBus.once(
        requestId,
        (message: ResponseMessage) => {
          if (message.error) {
            if (
              (message.error as {code?: SocketErrorCode}).code
                === SocketErrorCode.Forbidden
            ) {
              reject(new ForbiddenError());
            } else reject(message.error);
          } else resolve(message.result);
        },
      );

      this.socket.emit<RequestMessage>(
        SocketUpstreamEvent.Request,
        {
          requestId,
          event,
          path,
          value,
        },
      );
    });
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
    const encodedPath = encodePath(path);
    this.snapshotEventBus.on(encodedPath, (message: SnapshotMessage) => {
      callback(message.id, message.value);
    });
    await this.request(
      SocketRequestEvent.SubscribeDocument,
      path,
    );
    return async () => {
      this.snapshotEventBus.off(encodedPath, callback);
      await this.request(
        SocketRequestEvent.UnsubscribeDocument,
        path,
      );
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
    this.snapshotEventBus.on(encodedPath, (message: SnapshotMessage) => {
      callback(message.id, message.value);
    });
    await this.request(
      SocketRequestEvent.SubscribeCollection,
      path,
    );
    return async () => {
      this.snapshotEventBus.off(encodedPath, callback);
      await this.request(
        SocketRequestEvent.UnsubscribeCollection,
        path,
      );
    };
  }

  /**
   * Get a value of document
   * @param {DocumentPath} path - Path for document
   * @return {object | undefined} Value
   */
  public async get(path: DocumentPath): Promise<object | undefined> {
    const result = await this.request(SocketRequestEvent.Get, path);
    if (typeof result !== 'undefined' && typeof result !== 'object') {
      throw new TypeError();
    }
    return result;
  }

  /**
   * List values of collection
   * @param {CollectionPath} path - Path for collection
   * @return {[string, object][]} Values
   */
  public async list(path: CollectionPath): Promise<[string, object][]> {
    const result = await this.request(SocketRequestEvent.List, path);
    if (!Array.isArray(result)) {
      throw new TypeError();
    }
    return result;
  }

  /**
   * Update an document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   */
  public async update(path: DocumentPath, value: object): Promise<void> {
    await this.request(SocketRequestEvent.Update, path, value);
  }

  /**
   * Add new document
   * @param {CollectionPath} path - Path of collection to add
   * @param {object} value - Value
   * @return {Promise<string>} - Added id
   */
  public async add(path: CollectionPath, value: object): Promise<string> {
    const id = await this.request(SocketRequestEvent.Add, path, value);
    if (typeof id !== 'string') throw new TypeError();
    return id;
  }

  /**
   * Remove document
   * @param {DocumentPath} path - Path for document
   * @param {object} value - Value
   */
  public async remove(path: DocumentPath): Promise<void> {
    await this.request(SocketRequestEvent.Remove, path);
  }

  /**
   * Add file
   * @param {DocumentPath} path - Path for file
   * @param {AddFileParams} params - AddFileParams
   * @return {string} File id
   */
  public async addFile(
    path: CollectionPath,
    params: AddFileParams,
  ): Promise<string> {
    const id = await this.request(SocketRequestEvent.AddFile, path, params);
    if (typeof id !== 'string') throw new TypeError();
    return id;
  }

  /**
   * Delete file
   * @param {DocumentPath} path - Path for file
   */
  public async deleteFile(path: DocumentPath): Promise<void> {
    await this.request(SocketRequestEvent.DeleteFile, path);
  }

  /**
   * Get file url
   * @param {DocumentPath} path - Path for file
   * @return {string} URL
   */
  public async getFileUrl(path: DocumentPath): Promise<string> {
    const url = await this.request(SocketRequestEvent.GetDownloadUrl, path);
    if (typeof url !== 'string') throw new TypeError();
    return url;
  }
}
