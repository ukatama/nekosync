import { DocumentBase } from './Document';
import FileData from './FileData';

/**
 * File document
 */
export default class FileDocument extends DocumentBase<FileData> {
  /**
   * Delete file
   */
  public async del(): Promise<void> {
    await this.collection.backend.deleteFile(this.path);
  }

  /**
   * Get file url
   * @return {Promise<string>} URL of file
   */
  public async getUrl(): Promise<string> {
    return await this.collection.backend.getFileUrl(this.path);
  }
}
