import { columnHelper } from './helper';

export const kind = columnHelper.accessor('roleRef.kind', {
  header: 'Role Kind',
  id: 'roleKind',
});
