import {DocumentPath, getId} from '../common/Path';
import Backend from './backend/Backend';
import Collection from './Collection';

export type AttributesOf<D> = D extends Document<infer A> ? A : never;

export interface DocumentClassOf<D> {
  new (backend: Backend, path: DocumentPath, value: object): D;
}

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
  return (target, propertyKey) => {
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
 * Collection decorator
 * @param {DocumentClassOf<D>} DocumentClass - Constructor of Document
 * @param {string} name - Name of collection
 * @return {PropertyDecorator} - Decorator
 */
export function collection<D>(
  DocumentClass: DocumentClassOf<D>,
  name: string,
): PropertyDecorator {
  return (target: any, propertyKey) => {
    Object.defineProperty(target, propertyKey, {
      configurable: false,
      enumerable: true,
      get() {
        return new Collection(
          DocumentClass,
          this.backend,
          name,
          this.path,
        );
      },
    });
  };
}

/**
 * Data Document
 */
export default class Document<A extends {}> {
  private attributes?: {[key: string]: AttributeOptions};
  // private collections!: {[key: string]: Collection};

  public readonly backend: Backend;
  public readonly path: DocumentPath;

  /**
    * Constructor
    * @param {Backend} backend - Instance of backend;
    * @param {DocumentPath} path - Path of document
    * @param {object} value - Value
    */
  public constructor(backend: Backend, path: DocumentPath, value: object) {
    this.backend = backend;
    this.path = path;

    const {attributes} = this;
    if (attributes) {
      Object.keys(attributes).forEach((attributeName) => {
        const {required} = attributes[attributeName];
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

  /**
   * Getter of id
   * @return {string} - id
   */
  public get id(): string {
    return getId(this.path);
  }

  /**
   * Update
   * @param {object} value - value
   */
  public async update(value: Partial<A>): Promise<void> {
    await this.backend.update(this.path, value);
  }

  /**
   * Remove
   */
  public async remove(): Promise<void> {
    await this.backend.remove(this.path);
  }
}
