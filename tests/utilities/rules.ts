export default [
  {
    path: '/nekord-test-a/:id',
    read: true,
    write: true,
  },
  {
    path: '/nekord-test-b/:id',
    read: true,
    write: true,
  },
  {
    path: '/nekord-test-b/:id1/nekord-test-a/:id2',
    read: true,
    write: true,
  },
];
