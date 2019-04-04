export interface PathElement {
  collection: string;
  id: string;
}
export type DocumentPath = PathElement[];

export interface CollectionPath {
  parentPath: DocumentPath;
  collection: string;
}

/**
 * Encode path into string
 * @param {DocumentPath | CollectionPath} path - Path to encode
 * @return {string} - Encoded path
 */
export function encodePath(path: DocumentPath | CollectionPath): string {
  if (Array.isArray(path)) {
    return path.map((e) => `${e.collection}/${e.id}`).join('/');
  } else if (path.parentPath.length === 0) return path.collection;
  return `${encodePath(path.parentPath)}/${path.collection}`;
}

/**
 * Get collection path of the document
 * @param {DocumentPath} path - Path for document
 * @return {CollectionPath} - Path for collection
 */
export function getCollectionPath(path: DocumentPath): CollectionPath {
  const parentPath = path.slice(0, -1);
  const {collection} = path[path.length - 1];

  return {
    parentPath,
    collection,
  };
}

/**
 * Get collection path of the document
 * @param {CollectionPath} path - Path for collection
 * @param {id} id - Id of document
 * @return {DocumentPath} - Path for document
 */
export function getDocumentPath(
  path: CollectionPath,
  id: string,
): DocumentPath {
  return [
    ...path.parentPath,
    {
      collection: path.collection,
      id,
    },
  ];
}

/**
 * Get document id
 * @param {DocumentPath} path - Path for document
 * @return {string} - Id of document
 */
export function getId(path: DocumentPath): string {
  const {id} = path[path.length - 1];
  return id;
}
