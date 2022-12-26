import { CellContext } from '@tanstack/react-table';

import { Authorized } from '@/react/hooks/useUser';

import { Link } from '@@/Link';

import { Ingress } from '../../types';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Name', {
  header: 'Name',
  cell: Cell,
  id: 'name',
});

function Cell({ row, getValue }: CellContext<Ingress, string>) {
  const name = getValue();

  return (
    <Authorized authorizations="K8sIngressesW" childrenUnauthorized={name}>
      <Link
        to="kubernetes.ingresses.edit"
        params={{
          uid: row.original.UID,
          namespace: row.original.Namespace,
          name,
        }}
        title={name}
      >
        {name}
      </Link>
    </Authorized>
  );
}
