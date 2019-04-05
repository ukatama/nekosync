import {assert} from 'chai';
import {EventEmitter} from 'events';
import {
  ResponseMessage, SocketUpstreamEvent, SocketDownstreamEvent, RequestMessage,
} from '../../common/Socket';
import SocketBackend from './SocketBackend';

describe('SocketBackend', () => {
  class FakeSocket extends EventEmitter {
    public get id(): string {
      return 'id';
    }
  }
  const socket = new FakeSocket();
  const backend = new SocketBackend(socket);

  let requestId: string;
  let error: TypeError | undefined;
  it('emits request', () => new Promise((resolve) => {
    socket.on(SocketUpstreamEvent.Request, (message: RequestMessage) => {
      requestId = message.requestId;
      resolve();
    });
    backend.add(
      {parentPath: [], collection: 'nekord-test-a'},
      {a: 2},
    ).catch((e) => {
      error = e;
    });
  }));

  it('receives message', () => {
    const message: ResponseMessage = {
      requestId,
    };
    socket.emit(SocketDownstreamEvent.Response, message);
  });

  it('throws error', () => {
    assert.instanceOf(error, TypeError);
  });
});
