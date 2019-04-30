import { assert } from 'chai';
import jsdom from 'mocha-jsdom';
import FileCollection from './FileCollection';
import MemoryBackend from './backend/MemoryBackend';
import rules from '../tests/utilities/rules';
import FileDocument from './FileDocument';

describe('FileCollection', () => {
  jsdom({ url: 'https://127.0.0.1' });

  class CollectionA extends FileCollection {
    public get name(): string {
      return 'nekosync-test-a';
    }
  }
  const fileCollection = new CollectionA(new MemoryBackend(rules));

  class MockFile {
    public readonly name: string;
    public readonly type: string;

    public constructor(
      blobParts: BlobPart[],
      name: string,
      props?: FilePropertyBag,
    ) {
      this.name = name;
      this.type = (props && props.type) || '';
    }
  }

  class MockFileReader {
    public onload?: () => void;

    public readAsArrayBuffer(): ArrayBuffer {
      setTimeout(() => {
        if (this.onload) this.onload();
      });
      return new ArrayBuffer(32);
    }
  }

  // eslint-disable-next-line
  (global as any).File = MockFile;
  // eslint-disable-next-line
  (global as any).FileReader = MockFileReader;

  let document: FileDocument;
  it('adds file', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    document = await fileCollection.add(file);

    assert.equal(document.value.name, 'test.txt');
    assert.equal(document.value.type, 'text/plain');

    const url = await document.getUrl();
    assert.isString(url);
    assert.notEqual(url, '');
  });

  it('deletes file', async () => {
    await document.del();
  });
});
