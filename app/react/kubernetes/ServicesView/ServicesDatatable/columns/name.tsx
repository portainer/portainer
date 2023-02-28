import { CellProps, Column } from 'react-table';

import { Authorized } from '@/react/hooks/useUser';
import KubernetesNamespaceHelper from '@/kubernetes/helpers/namespaceHelper';

import { Service } from '../../types';

export const name: Column<Service> = {
  Header: 'Name',
  id: 'Name',
  accessor: (row) => row.Name,
  Cell: ({ row }: CellProps<Service>) => {
    const isSystem = KubernetesNamespaceHelper.isSystemNamespace(
      row.original.Namespace
    );

    const isExternal =
      !row.original.Labels ||
      !row.original.Labels['io.portainer.kubernetes.application.owner'];

    return (
      <Authorized
        authorizations="K8sServiceW"
        childrenUnauthorized={row.original.Name}
      >
        {row.original.Name}

        {isSystem && (
          <span className="label label-info image-tag label-margins">
            system
          </span>
        )}

        {isExternal && !isSystem && (
          <span className="label label-primary image-tag label-margins">
            external
          </span>
        )}
      </Authorized>
    );
  },

  disableFilters: true,
  canHide: true,
};
