import { Authorized } from '@/react/hooks/useUser';
import { isSystemNamespace } from '@/react/kubernetes/namespaces/utils';

import { Badge } from '@@/Badge';

import { columnHelper } from './helper';

export const name = columnHelper.accessor(
  (row) => {
    let name = row.Name;

    const isExternal =
      !row.Labels || !row.Labels['io.portainer.kubernetes.application.owner'];
    const isSystem = isSystemNamespace(row.Namespace);

    if (isExternal && !isSystem) {
      name = `${name} external`;
    }

    if (isSystem) {
      name = `${name} system`;
    }
    return name;
  },
  {
    header: 'Name',
    id: 'name',
    cell: ({ row }) => {
      const name = row.original.Name;
      const isSystem = isSystemNamespace(row.original.Namespace);

      const isExternal =
        !row.original.Labels ||
        !row.original.Labels['io.portainer.kubernetes.application.owner'];

      return (
        <div className="flex">
          <Authorized authorizations="K8sServiceW" childrenUnauthorized={name}>
            {name}

            {isSystem && (
              <Badge type="success" className="ml-2">
                System
              </Badge>
            )}

            {isExternal && !isSystem && (
              <Badge className="ml-2">External</Badge>
            )}
          </Authorized>
        </div>
      );
    },
  }
);
