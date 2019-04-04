export default [
  {
    path: '/nekord-test-value-simple-collection/:id',
    read: true,
    write: true,
  },
  {
    path: '/nekord-test-value-nested-collection-1/:id',
    read: true,
    write: true,
  },
  {
    // eslint-disable-next-line max-len
    path: '/nekord-test-value-nested-collection-1/:id1/nekord-test-value-nested-collection-2/:id2',
    read: true,
    write: true,
  },
  {
    path: '/nekord-test-children-simple-collection/:id',
    read: true,
    write: true,
  },
  {
    path: '/nekord-test-children-nested-collection-1/:id',
    read: true,
    write: true,
  },
  {
    // eslint-disable-next-line max-len
    path: '/nekord-test-children-nested-collection-1/:id1/nekord-test-children-nested-collection-2/:id2',
    read: true,
    write: true,
  },
];
