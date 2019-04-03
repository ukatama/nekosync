import Collection from './Collection';

/**
 * Data model
 */
export default class Model {
  public collection: Collection;
  public id: string;

  /**
    * Constructor
    * @param {Collection} collection - Parent collection
    * @param {id} id - Item id
    */
  public constructor(collection: Collection, id: string) {
    this.collection = collection;
    this.id = id;
  }
}
