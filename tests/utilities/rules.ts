import {getId} from '../../common/Path';
import Rule from '../../common/Rule';

const rules: Rule[] = [
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
  {
    path: '/nekord-test-c/:id',
    read: true,
    async write(path, params, reader) {
      const { id } = params;
      if (!id) return false;
      const d = await reader.get([{collection: 'nekord-test-d', id}]);
      return d ? (d as any).writable : false;
    }
  },
  {
    path: '/nekord-test-d/:id',
    read: true,
    write: true,
  },
];
export default rules;
