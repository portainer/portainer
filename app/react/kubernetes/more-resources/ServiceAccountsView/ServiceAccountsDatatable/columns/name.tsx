import { isSystemNamespace } from '@/react/kubernetes/namespaces/queries/useIsSystemNamespace';
import { PortainerNamespace } from '@/react/kubernetes/namespaces/types';

import { SystemBadge } from '@@/Badge/SystemBadge';

import { columnHelper } from './helper';

export function name(namespaces?: PortainerNamespace[]) {
  return columnHelper.accessor(
    (row) => {
      let result = row.name;
      if (isSystemNamespace(row.namespace, namespaces)) {
        result += ' system';
      }
      return result;
    },
    {
      header: 'Name',
      id: 'name',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <div>{row.original.name}</div>
          {isSystemNamespace(row.original.namespace, namespaces) && (
            <SystemBadge />
          )}
        </div>
      ),
    }
  );
}
