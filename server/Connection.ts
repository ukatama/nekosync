import {EventEmitter} from 'events';
import {
  CollectionPath,
  DocumentPath,
  encodePath,
  getCollectionPath,
  getDocumentPath,
  getId,
} from '../common/Path';
import Rule, {CompiledRule, compile, authorize} from '../common/Rule';
import Socket, {
  SocketDownstreamEvent,
  SocketErrorCode,
  SocketRequestEvent,
  SocketUpstreamEvent,
  SnapshotMessage,
  RequestMessage,
  ResponseMessage,
} from '../common/Socket';
import Datastore from './datastore/Datastore';

/**
 * ConnectionError
 */
class ConnectionError extends Error {
  public code: SocketErrorCode;

  /**
   * Constructor
   * @param {SocketErrorCode} code - Error code
   */
  public constructor(code: SocketErrorCode) {
    super();
    this.code = code;
  }
}

/**
 * Connection
 */
export default class Connection {
  private socket: Socket;
  private datastore: Datastore;
  private eventBus: EventEmitter;
  private rules: CompiledRule[];
  private subscriptionCounter: { [path: string]: number | undefined } = {};
  private onSnapshot: (
    path: DocumentPath | CollectionPath,
    id: string,
    value: object | undefined,
  ) => void

  /**
   * Constructor
   * @param {Socket} socket - Socket instance
   * @param {Datastore} datastore - Datastore instance
   * @param {EventEmitter} eventBus - EventBus instance
   * @param {Rule[]} rules - Rules
   */
  public constructor(
    socket: Socket,
    datastore: Datastore,
    eventBus: EventEmitter,
    rules: Rule[],
  ) {
    this.socket = socket;
    this.datastore = datastore;
    this.eventBus = eventBus;
    this.rules = compile(rules);
    this.onSnapshot = (
      path: DocumentPath | CollectionPath,
      id: string,
      value: object | undefined,
    ) => {
      this.socket.emit<SnapshotMessage>(
        SocketDownstreamEvent.Snapshot,
        {path, id, value},
      );
    };

    this.socket.on(
      SocketUpstreamEvent.Request,
      async (message: RequestMessage) => {
        const {requestId, event, path, value} = message;
        try {
          const result = await this.onRequest(event, path, value);
          this.socket.emit<ResponseMessage>(
            SocketDownstreamEvent.Response,
            {
              requestId,
              result,
            },
          );
        } catch (error) {
          this.socket.emit(SocketDownstreamEvent.Response, {requestId, error});
        }
      },
    );
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
      get: (path) => this.datastore.get(path),
      list: (path) => this.datastore.list(path),
      getUserId: async () => this.socket.id,
    });
    if (!result) throw new ConnectionError(SocketErrorCode.Forbidden);
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
   * @param {path} path - Path for document or colection
   * @param {object | undefined} value - Value
   * @return {Promise<string | undefined>} - result
   */
  private async onRequest(
    event: SocketRequestEvent,
    path: DocumentPath | CollectionPath,
    value?: object,
  ): Promise<string | undefined> {
    switch (event) {
      case SocketRequestEvent.SubscribeDocument:
      case SocketRequestEvent.SubscribeCollection: {
        await this.authorize(path, 'read');
        const encodedPath = encodePath(path);
        this.subscriptionCounter[encodedPath]
          = (this.subscriptionCounter[encodedPath] || 0) + 1;
        if (this.subscriptionCounter[encodedPath] === 1) {
          this.eventBus.on(encodedPath, this.onSnapshot);
        }
        if (Array.isArray(path)) {
          const value = await this.datastore.get(path);
          this.socket.emit<SnapshotMessage>(
            SocketDownstreamEvent.Snapshot,
            {
              path,
              id: getId(path),
              value,
            },
          );
        } else {
          const values = await this.datastore.list(path);
          values.forEach(({id, value}) => {
            this.socket.emit<SnapshotMessage>(
              SocketDownstreamEvent.Snapshot,
              {
                path,
                id,
                value,
              },
            );
          });
        }
        return undefined;
      }
      case SocketRequestEvent.UnsubscribeDocument:
      case SocketRequestEvent.UnsubscribeCollection: {
        await this.authorize(path, 'write');
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
        if (!Array.isArray(path) || value === undefined) throw new Error();
        await this.authorize(path, 'write');
        const newValue = await this.datastore.update(path, value);
        this.emitUpdate(path, newValue);
        return undefined;
      }
      case SocketRequestEvent.Add: {
        if (Array.isArray(path) || value === undefined) throw new Error();
        await this.authorize(path, 'write');
        const id = await this.datastore.add(path, value);
        this.emitUpdate(getDocumentPath(path, id), value);
        return id;
      }
      case SocketRequestEvent.Remove: {
        if (!Array.isArray(path)) throw new Error();
        await this.authorize(path, 'write');
        await this.datastore.remove(path);
        this.emitUpdate(path, undefined);
        return;
      }
    }
    throw new Error(`Unknown event (${event})`);
  }
}
