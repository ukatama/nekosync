import Backend from '../../client/backend/Backend';

export default function collectionCleaner(
  backend: Backend,
  collection: string,
) {
  return async () => {
    const list = await backend.list({
      parentPath: [],
      collection,
    });
    await Promise.all(list.map(([id]) => backend.remove([{ collection, id }])));
  };
}
