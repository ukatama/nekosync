import {DocumentPath, CollectionPath} from './Path';

export type Callback<T> = (payload: T) => void;

export default interface Socket {
  id: string;
  emit<T>(event: string, payload: T): void;
  on<T>(event: string, callback: Callback<T>): void;
  once<T>(event: string, callback: Callback<T>): void;
  off<T>(event: string, callback: Callback<T>): void;
}

export enum SocketUpstreamEvent {
  Request = 'Request',
}

export enum SocketDownstreamEvent {
  Response = 'Response',
  Snapshot = 'Snapshot',
}

export enum SocketRequestEvent {
  SubscribeDocument = 'SubscribeDocument',
  SubscribeCollection = 'SubscribeCollection',
  UnsubscribeDocument = 'UnsubscribeDocument',
  UnsubscribeCollection = 'UnsubscribeCollection',
  Update = 'Update',
  Add = 'Add',
  Remove = 'Remove',
}

export enum SocketErrorCode {
  Forbidden,
}

export interface RequestMessage {
  requestId: string;
  event: SocketRequestEvent;
  path: DocumentPath | CollectionPath;
  value?: object;
}

export interface ResponseMessage {
  requestId: string;
  error?: object;
  result?: string;
}

export interface SnapshotMessage {
  path: DocumentPath | CollectionPath;
  id: string;
  value?: object;
}
