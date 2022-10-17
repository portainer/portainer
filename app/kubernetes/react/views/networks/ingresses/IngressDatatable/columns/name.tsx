import { CellProps, Column } from 'react-table';

import { Authorized } from '@/portainer/hooks/useUser';

import { Link } from '@@/Link';

import { Ingress } from '../../types';

export const name: Column<Ingress> = {
  Header: 'Name',
  accessor: 'Name',
  Cell: ({ row }: CellProps<Ingress>) => (
    <Authorized
      authorizations="K8sIngressesW"
      childrenUnauthorized={row.original.Name}
    >
      <Link
        to="kubernetes.ingresses.edit"
        params={{
          uid: row.original.UID,
          namespace: row.original.Namespace,
          name: row.original.Name,
        }}
        title={row.original.Name}
      >
        {row.original.Name}
      </Link>
    </Authorized>
  ),
  id: 'name',
  disableFilters: true,
  canHide: true,
};
