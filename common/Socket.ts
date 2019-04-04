export default interface Socket {
  emit(event: string, ...args: any): void;
  on(event: string, callback: (...args: any) => void): void;
  once(event: string, callback: (...args: any) => void): void;
  off(event: string, callback: (...args: any) => void): void;
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
