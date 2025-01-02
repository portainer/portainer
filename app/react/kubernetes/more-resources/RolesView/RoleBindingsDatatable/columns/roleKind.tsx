import { columnHelper } from './helper';

export const roleKind = columnHelper.accessor('roleRef.kind', {
  header: 'Role Kind',
  id: 'roleKind',
});
