import {
  TeamAccessViewModel,
  UserAccessViewModel,
} from '@/portainer/models/access';

export type Access = UserAccessViewModel | TeamAccessViewModel;

export interface TableMeta {
  table: 'access-table';
  roles: {
    getRoleValue(id: number, entity: 'user' | 'team'): number | undefined;
    setRolesValue(
      id: number,
      entity: 'user' | 'team',
      value: number | undefined
    ): void;
  };
}

function isTableMeta(meta?: unknown): meta is TableMeta {
  return (
    !!meta &&
    typeof meta === 'object' &&
    'table' in meta &&
    meta.table === 'access-table'
  );
}

export function getTableMeta(meta: unknown) {
  if (!isTableMeta(meta)) {
    throw new Error('missing table meta');
  }
  return meta;
}
