import {EventEmitter} from 'events';
import Socket, {
  SocketUpstreamEvent, SocketRequestEvent, SocketDownstreamEvent,
} from '../common/Socket';
import DataStore from './dataStore/DataStore';
import {
  encodePath, DocumentPath, CollectionPath, getCollectionPath, getId, getDocumentPath,
} from '../common/Path';

/**
 * Connection
 */
export default class Connection {
  private socket: Socket;
  private dataStore: DataStore;
  private eventBus: EventEmitter;
  private subscriptionCounter: { [path: string]: number | undefined } = {};
  private onSnapshot: (
    path: DocumentPath | CollectionPath,
    id: string,
    value: object | undefined,
  ) => void

  /**
   * Constructor
   * @param {Socket} socket - Socket instance
   * @param {DataStore} dataStore - DataStore instance
   * @param {EventEmitter} eventBus - EventBus instance
   */
  public constructor(
    socket: Socket,
    dataStore: DataStore,
    eventBus: EventEmitter,
  ) {
    this.socket = socket;
    this.dataStore = dataStore;
    this.eventBus = eventBus;
    this.onSnapshot = (
      path: DocumentPath | CollectionPath,
      id: string,
      value: object | undefined,
    ) => {
      this.socket.emit(SocketDownstreamEvent.Snapshot, path, id, value);
    };

    this.socket.on(
      SocketUpstreamEvent.Request,
      async (requestId: string, event: SocketRequestEvent, ...args: any) => {
        try {
          const result = await this.onRequest(event, ...args);
          this.socket.emit(
            SocketDownstreamEvent.Response,
            requestId,
            undefined,
            result,
          );
        } catch (e) {
          this.socket.emit(SocketDownstreamEvent.Response, requestId, e);
        }
      },
    );
  }

  /**
   * Emit update event to eventBus
   * @param {DocumentPath} path - Path for document
   * @param {object | undefined} value - Value to emit
   */
  private emitUpdate(path: DocumentPath, value: object | undefined): void {
    const id = getId(path);
    const collectionPath = getCollectionPath(path);
    this.eventBus.emit(encodePath(path), path, id, value);
    this.eventBus.emit(encodePath(collectionPath), collectionPath, id, value);
  }

  /**
   * Request handler
   * @param {SocketRequestEvent} event - Event
   * @param {any} args - Args
   * @return {Promise<any>} - result
   */
  private async onRequest(
    event: SocketRequestEvent,
    ...args: any
  ): Promise<any> {
    switch (event) {
      case SocketRequestEvent.SubscribeDocument:
      case SocketRequestEvent.SubscribeCollection: {
        const [path]: [DocumentPath | CollectionPath] = args;
        const encodedPath = encodePath(path);
        this.subscriptionCounter[encodedPath]
          = (this.subscriptionCounter[encodedPath] || 0) + 1;
        if (this.subscriptionCounter[encodedPath] === 1) {
          this.eventBus.on(encodedPath, this.onSnapshot);
        }
        if (Array.isArray(path)) {
          const value = await this.dataStore.get(path);
          this.socket.emit(
            SocketDownstreamEvent.Snapshot,
            path,
            getId(path),
            value,
          );
        } else {
          const values = await this.dataStore.list(path);
          values.forEach(({id, value}) => {
            this.socket.emit(
              SocketDownstreamEvent.Snapshot,
              path,
              id,
              value,
            );
          });
        }
        return undefined;
      }
      case SocketRequestEvent.UnsubscribeDocument:
      case SocketRequestEvent.UnsubscribeCollection: {
        const [path]: [DocumentPath | CollectionPath] = args;
        const encodedPath = encodePath(path);
        const count = this.subscriptionCounter[encodedPath] || 0;
        if (count > 0) {
          this.subscriptionCounter[encodedPath] = count - 1;
          if (this.subscriptionCounter[encodedPath] === 0) {
            this.eventBus.off(encodedPath, this.onSnapshot);
          }
        }
        return undefined;
      }
      case SocketRequestEvent.Update: {
        const [path, value]: [DocumentPath, object] = args;
        const newValue = await this.dataStore.update(path, value);
        this.emitUpdate(path, newValue);
        return undefined;
      }
      case SocketRequestEvent.Add: {
        const [path, value]: [CollectionPath, object] = args;
        const id = await this.dataStore.add(path, value);
        this.emitUpdate(getDocumentPath(path, id), value);
        return id;
      }
      case SocketRequestEvent.Remove: {
        const [path]: [DocumentPath] = args;
        await this.dataStore.remove(path);
        this.emitUpdate(path, undefined);
        return;
      }
    }
    throw new Error(`Unknown event (${event})`);
  }
}
