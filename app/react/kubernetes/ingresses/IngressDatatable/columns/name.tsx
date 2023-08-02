import { CellContext } from '@tanstack/react-table';

import { Authorized } from '@/react/hooks/useUser';
import { isSystemNamespace } from '@/react/kubernetes/namespaces/utils';

import { Link } from '@@/Link';
import { Badge } from '@@/Badge';

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
  const isSystemIngress = isSystemNamespace(namespace);

  return (
    <div className="flex whitespace-nowrap">
      <Authorized authorizations="K8sIngressesW" childrenUnauthorized={name}>
        <Link
          to="kubernetes.ingresses.edit"
          params={{
            uid: row.original.UID,
            namespace,
            name,
          }}
          title={name}
        >
          {name}
        </Link>
      </Authorized>
      {isSystemIngress && (
        <Badge type="success" className="ml-2">
          system
        </Badge>
      )}
    </div>
  );
}
