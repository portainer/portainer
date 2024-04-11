import { CellContext } from '@tanstack/react-table';

import { useIsSystemNamespace } from '@/react/kubernetes/namespaces/queries/useIsSystemNamespace';

import { Link } from '@@/Link';
import { SystemBadge } from '@@/Badge/SystemBadge';
import { ExternalBadge } from '@@/Badge/ExternalBadge';

import { helper } from './columns.helper';
import { Application } from './types';

export const name = helper.accessor('Name', {
  header: 'Name',
  cell: Cell,
});

function Cell({ row: { original: item } }: CellContext<Application, string>) {
  const isSystem = useIsSystemNamespace(item.ResourcePool);

  return (
    <div className="flex items-center gap-2">
      {item.KubernetesApplications ? (
        <Link
          data-cy="application-helm-link"
          to="kubernetes.helm"
          params={{ name: item.Name, namespace: item.ResourcePool }}
        >
          {item.Name}
        </Link>
      ) : (
        <Link
          data-cy="application-link"
          to="kubernetes.applications.application"
          params={{
            name: item.Name,
            namespace: item.ResourcePool,
            'resource-type': item.ApplicationType,
          }}
        >
          {item.Name}
        </Link>
      )}

      {isSystem ? <SystemBadge /> : !item.ApplicationOwner && <ExternalBadge />}
    </div>
  );
}
