import { assert } from 'chai';
import { EventEmitter } from 'events';
import path from 'path';
import shortid from 'shortid';
import { fake } from 'sinon';
import {
  RequestMessage,
  SocketDownstreamEvent,
  SocketRequestEvent,
  SocketUpstreamEvent,
} from '../common/Socket';
import rules from '../tests/utilities/rules';
import MemoryDatastore from './datastore/MemoryDatastore';
import Connection from './Connection';

describe('Connection', () => {
  const SocketId = shortid();
  class TestSocket extends EventEmitter {
    public get id(): string {
      return SocketId;
    }
  }

  const socket = new TestSocket();
  const datastore = new MemoryDatastore();
  const eventBus = new EventEmitter();

  const callback = fake();
  socket.on(SocketDownstreamEvent.Response, callback);

  it('can initalize', () => {
    new Connection({
      socket,
      datastore,
      eventBus,
      rules,
      filepath: path.join(__dirname, '../../data'),
    });
  });

  const requestId = shortid();
  it('receives event', () => {
    const message: RequestMessage = {
      requestId,
      event: 'UnknownEvent' as SocketRequestEvent,
      path: [],
    };
    socket.emit(SocketUpstreamEvent.Request, message);
  });

  it('throws TypeError due to unknown event', () => {
    const message = callback.lastCall.args[0];
    assert.equal(message.requestId, requestId);
    assert.isDefined(message.error);
    assert.equal(message.error.message, 'Unknown event (UnknownEvent)');
  });

  it('can unsubscribe', () => {
    socket.emit(SocketUpstreamEvent.Request, {
      requestId,
      event: SocketRequestEvent.UnsubscribeCollection,
      path: { parentPath: [], collection: 'nekord-test-a' },
    });
  });

  it('receives event', () => {
    callback.resetHistory();
    socket.emit(SocketUpstreamEvent.Request, {
      requestId: shortid(),
      event: SocketRequestEvent.Update,
      path: { parentPath: [], collection: 'nekord-test-a' },
      value: {},
    });
    socket.emit(SocketUpstreamEvent.Request, {
      requestId: shortid(),
      event: SocketRequestEvent.Update,
      path: [{ collection: 'nekord-test-a', id: shortid() }],
    });
    socket.emit(SocketUpstreamEvent.Request, {
      requestId: shortid(),
      event: SocketRequestEvent.Add,
      path: [{ collection: 'nekord-test-a', id: shortid() }],
      value: {},
    });
    socket.emit(SocketUpstreamEvent.Request, {
      requestId: shortid(),
      event: SocketRequestEvent.Add,
      path: { parentPath: [], collection: 'nekord-test-a' },
    });
    socket.emit(SocketUpstreamEvent.Request, {
      requestId: shortid(),
      event: SocketRequestEvent.Remove,
      path: { parentPath: [], collection: 'nekord-test-a' },
    });
  });

  it('responds type error', () => {
    callback.getCalls().forEach(call => {
      const { error } = call.args[0];
      assert.isDefined(error);
      assert.instanceOf(error, TypeError);
    });
  });
});
