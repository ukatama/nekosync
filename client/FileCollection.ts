import Collection from './Collection';
import FileData from './FileData';
import FileDocument from './FileDocument';

/**
 * Read file
 * @param {Blob} file - File
 * @return {Promise<ArrayBuffer>} Data
 */
function readFile(file: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * File collection
 */
export default abstract class FileCollection<
  T extends object = {}
> extends Collection<FileData, FileDocument> {
  /**
   * Create document instance
   * @param {string} id - ID
   * @param {V | undefined} value - Value
   * @return {U} Document
   */
  public createDocument(id: string, value?: FileData): FileDocument {
    return new FileDocument(this, id, value);
  }

  /**
   * Add file
   * @param {File} file - File
   */
  public async add(file: File): Promise<FileDocument> {
    const data = await readFile(file);
    const { name, type } = file;
    const id = await this.backend.addFile(this.path, { data, name, type });
    return new FileDocument(this, id, { name, type });
  }
}
