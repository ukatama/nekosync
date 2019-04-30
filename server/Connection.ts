/* eslint require-jsdoc: off */

import {EventEmitter} from 'events';
import {promises as fs} from 'fs';
import {join} from 'path';
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

export interface ConnectionOptions {
  socket: Socket;
  datastore: Datastore;
  eventBus: EventEmitter;
  rules: Rule[];
  filepath: string;
}

function asDocumentPath(path: DocumentPath | CollectionPath): DocumentPath {
  if (!Array.isArray(path)) {
    throw new TypeError('Path must be DocumentPath');
  }
  return path;
}

function asCollectionPath(path: DocumentPath | CollectionPath): CollectionPath {
  if (Array.isArray(path)) {
    throw new TypeError('Path must be DocumentPath');
  }
  return path;
}

function asObject(payload?: object): object {
  if (typeof payload !== 'object') {
    throw new TypeError('Payload must be Object');
  }
  return payload;
}

/**
 * Connection
 */
export default class Connection {
  private socket: Socket;
  private datastore: Datastore;
  private eventBus: EventEmitter;
  private rules: CompiledRule[];
  private filepath: string;
  private subscriptionCounter: { [path: string]: number | undefined } = {};
  private onSnapshot: (
    path: DocumentPath | CollectionPath,
    id: string,
    value: object | undefined,
  ) => void

  /**
   * Constructor
   * @param {Connectionoptions} options - Options
   */
  public constructor(options: ConnectionOptions) {
    this.socket = options.socket;
    this.datastore = options.datastore;
    this.eventBus = options.eventBus;
    this.rules = compile(options.rules);
    this.filepath = options.filepath;

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

  private async onRequest(
    event: SocketRequestEvent,
    path: DocumentPath | CollectionPath,
    payload?: object,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any | undefined> {
    switch (event) {
      case SocketRequestEvent.SubscribeDocument:
      case SocketRequestEvent.SubscribeCollection:
        return await this.onSubscribe(path);
      case SocketRequestEvent.UnsubscribeDocument:
      case SocketRequestEvent.UnsubscribeCollection:
        return await this.onUnsubscribe(path);
      case SocketRequestEvent.Get:
        return await this.onGet(asDocumentPath(path));
      case SocketRequestEvent.List:
        return await this.onList(asCollectionPath(path));
      case SocketRequestEvent.Update:
        return await this.onUpdate(asDocumentPath(path), asObject(payload));
      case SocketRequestEvent.Add:
        return await this.onAdd(asCollectionPath(path), asObject(payload));
      case SocketRequestEvent.Remove:
        return await this.onRemove(asDocumentPath(path));
      case SocketRequestEvent.AddFile: {
        const {
          data,
          type,
          name,
        } = (asObject(payload)) as {[key: string]: ArrayBuffer | string};

        if (!(data instanceof ArrayBuffer)) {
          throw new TypeError('Data must be ArrayBuffer');
        }
        if (typeof type !== 'string') {
          throw new TypeError('Type must be string');
        }
        if (typeof name !== 'string') {
          throw new TypeError('Name must be string');
        }

        return await this.onAddFile(asCollectionPath(path), data, type, name);
      }
      case SocketRequestEvent.DeleteFile:
        return await this.onDeleteFile(asDocumentPath(path));
      case SocketRequestEvent.GetDownloadUrl:
        return await this.onGetDownloadUrl(asDocumentPath(path));
    }
    throw new TypeError(`Unknown event (${event})`);
  }

  private async onSubscribe(
    path: DocumentPath | CollectionPath,
  ): Promise<void> {
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
      values.forEach(([id, value]) => {
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
  }

  private async onUnsubscribe(path: DocumentPath | CollectionPath): Promise<void> {
    await this.authorize(path, 'write');
    const encodedPath = encodePath(path);
    const count = this.subscriptionCounter[encodedPath] || 0;
    if (count > 0) {
      this.subscriptionCounter[encodedPath] = count - 1;
      if (this.subscriptionCounter[encodedPath] === 0) {
        this.eventBus.off(encodedPath, this.onSnapshot);
      }
    }
  }

  private async onGet(path: DocumentPath): Promise<object | undefined> {
    await this.authorize(path, 'read');
    return await this.datastore.get(path);
  }

  private async onList(path: CollectionPath): Promise<object[]> {
    await this.authorize(path, 'read');
    return await this.datastore.list(path);
  }

  private async onUpdate(path: DocumentPath, value: object): Promise<void> {
    await this.authorize(path, 'write');
    const newValue = await this.datastore.update(path, value);
    this.emitUpdate(path, newValue);
  }

  private async onAdd(path: CollectionPath, value: object): Promise<string> {
    await this.authorize(path, 'write');
    const id = await this.datastore.add(path, value);
    this.emitUpdate(getDocumentPath(path, id), value);
    return id;
  }

  private async onRemove(path: DocumentPath): Promise<void> {
    await this.authorize(path, 'write');
    await this.datastore.remove(path);
    this.emitUpdate(path, undefined);
  }

  private async onAddFile(
    path: CollectionPath,
    data: ArrayBuffer,
    type: string,
    name: string,
  ): Promise<string> {
    const id = await this.onAdd(path, {name, type});

    await fs.mkdir(this.filepath, {recursive: true});
    await fs.writeFile(join(this.filepath, id), Buffer.from(data));

    return id;
  }

  private async onDeleteFile(path: DocumentPath): Promise<void> {
    await this.datastore.remove(path);
    await fs.unlink(join(this.filepath, getId(path)));
  }

  private async onGetDownloadUrl(path: DocumentPath): Promise<string> {
    await this.authorize(path, 'read');
    return `/files/${getId(path)}`;
  }
}
