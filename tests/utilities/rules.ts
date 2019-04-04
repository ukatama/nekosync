export default [
  {
    path: '/nekodb-test-value-simple-collection/:id',
    read: true,
    write: true,
  },
  {
    path: '/nekodb-test-value-nested-collection-1/:id',
    read: true,
    write: true,
  },
  {
    // eslint-disable-next-line max-len
    path: '/nekodb-test-value-nested-collection-1/:id1/nekodb-test-value-nested-collection-2/:id2',
    read: true,
    write: true,
  },
  {
    path: '/nekodb-test-children-simple-collection/:id',
    read: true,
    write: true,
  },
  {
    path: '/nekodb-test-children-nested-collection-1/:id',
    read: true,
    write: true,
  },
  {
    // eslint-disable-next-line max-len
    path: '/nekodb-test-children-nested-collection-1/:id1/nekodb-test-children-nested-collection-2/:id2',
    read: true,
    write: true,
  },
];
