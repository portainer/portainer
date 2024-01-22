import { Authorized } from '@/react/hooks/useUser';

import { Badge } from '@@/Badge';

import { columnHelper } from './helper';

export const name = columnHelper.accessor(
  (row) => {
    let name = row.Name;

    const isExternal =
      !row.Labels || !row.Labels['io.portainer.kubernetes.application.owner'];

    if (isExternal && !row.IsSystem) {
      name = `${name} external`;
    }

    if (row.IsSystem) {
      name = `${name} system`;
    }
    return name;
  },
  {
    header: 'Name',
    id: 'name',
    cell: ({ row }) => {
      const name = row.original.Name;

      const isExternal =
        !row.original.Labels ||
        !row.original.Labels['io.portainer.kubernetes.application.owner'];

      return (
        <div className="flex">
          <Authorized authorizations="K8sServiceW" childrenUnauthorized={name}>
            {name}

            {row.original.IsSystem && (
              <Badge type="success" className="ml-2">
                System
              </Badge>
            )}

            {isExternal && !row.original.IsSystem && (
              <Badge className="ml-2">External</Badge>
            )}
          </Authorized>
        </div>
      );
    },
  }
);
