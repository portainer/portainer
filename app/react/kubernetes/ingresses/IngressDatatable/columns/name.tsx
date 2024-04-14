import { CellContext } from '@tanstack/react-table';

import { Authorized } from '@/react/hooks/useUser';

import { SystemBadge } from '@@/Badge/SystemBadge';
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
  const namespace = row.original.Namespace;

  return (
    <div className="flex flex-nowrap whitespace-nowrap gap-2">
      <Authorized authorizations="K8sIngressesW" childrenUnauthorized={name}>
        <Link
          to="kubernetes.ingresses.edit"
          params={{
            uid: row.original.UID,
            namespace,
            name,
          }}
          title={name}
          data-cy={`ingress-name-link-${name}`}
        >
          {name}
        </Link>
      </Authorized>
      {row.original.IsSystem && <SystemBadge />}
    </div>
  );
}
