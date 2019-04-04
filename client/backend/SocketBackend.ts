import shortid from 'shortid';
import {EventEmitter} from 'events';
import {DocumentPath, CollectionPath, encodePath} from '../../common/Path';
import Socket, {
  SocketUpstreamEvent, SocketDownstreamEvent, SocketRequestEvent, SocketErrorCode,
} from '../../common/Socket';
import Backend, {Callback, Unsubscribe} from './Backend';
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
      (requestId: string, error: object | undefined, result: any) => {
        this.requestEventBus.emit(requestId, error, result);
      },
    );
    this.socket.on(
      SocketDownstreamEvent.Snapshot,
      (
        path: DocumentPath | CollectionPath,
        id: string,
        value: object | undefined,
      ) => {
        this.snapshotEventBus.emit(encodePath(path), id, value);
      },
    );
  }

  /**
   * Send asynchronous request
   * @param {SocketRequestEvent} event - Action type
   * @param {T} args - Args
   * @return {Promise<U>} - response
   */
  private request<T = void>(
    event: SocketRequestEvent,
    ...args: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = shortid();
      this.requestEventBus.once(
        requestId,
        (error: object | undefined, result: T) => {
          if (error) {
            if ((error as any).code === SocketErrorCode.Forbidden) reject(new ForbiddenError())
            else reject(error);
          } else resolve(result);
        },
      );
      this.socket.emit(
        SocketUpstreamEvent.Request,
        requestId,
        event,
        ...args,
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
    this.snapshotEventBus.on(encodedPath, callback);
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
    this.snapshotEventBus.on(encodedPath, callback);
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
    const id = await this.request<string>(SocketRequestEvent.Add, path, value);
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
}
