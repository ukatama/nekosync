/**
 * MissingAttributeError
 */
export class MissingAttributeError extends Error {
  /**
   * Constructor
   * @param {string} attributeName - Name of missing attribute
   */
  public constructor(attributeName: string) {
    super(`${attributeName} is missing`);
  }
}

export interface AttributeOptions {
  required?: boolean;
}

/**
 * Attribute decorator
 * @param {AttributeOptions | undefined} options - Attributeoptions
 * @return {PropertyDecorator} - Decorator
 */
export function attribute(options: AttributeOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    if ((target as any).attributes === undefined) {
      Object.defineProperty(target, 'attributes', {
        configurable: false,
        enumerable: false,
        value: {},
      });
    }
    Object.defineProperty((target as any).attributes, propertyKey, {
      configurable: false,
      enumerable: true,
      value: options,
    });
  };
}

/**
 * Data model
 */
export default class Model<Attributes> {
  public id: string;
  private attributes!: {[key: string]: AttributeOptions};

  /**
    * Constructor
    * @param {string} id - ID
    * @param {object} value - Value
    */
  public constructor(id: string, value: object) {
    this.id = id;
    Object.keys(this.attributes).forEach((attributeName) => {
      const {required} = this.attributes[attributeName];
      const attributeValue = (value as any)[attributeName];
      if (required && attributeValue === undefined) {
        throw new MissingAttributeError(attributeName);
      }
      Object.assign(this, {
        [attributeName]: attributeValue,
      });
    });
  }
}
