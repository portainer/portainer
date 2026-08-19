import { columnHelper } from './helper';

export const roleName = columnHelper.accessor('roleRef.name', {
  header: 'Role Name',
  id: 'roleName',
});
