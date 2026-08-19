import { CellContext } from '@tanstack/react-table';

import { isExternalApplication } from '@/react/kubernetes/applications/utils';
import { useIsSystemNamespace } from '@/react/kubernetes/namespaces/queries/useIsSystemNamespace';
import { Application } from '@/react/kubernetes/applications/ListView/ApplicationsDatatable/types';

import { Link } from '@@/Link';
import { SystemBadge } from '@@/Badge/SystemBadge';
import { ExternalBadge } from '@@/Badge/ExternalBadge';

import { helper } from './columns.helper';

export const name = helper.accessor('Name', {
  header: 'Name',
  cell: Cell,
});

function Cell({ row: { original: item } }: CellContext<Application, string>) {
  const isSystem = useIsSystemNamespace(item.ResourcePool);
  return (
    <div className="flex items-center gap-2">
      <Link
        to="kubernetes.applications.application"
        params={{ name: item.Name, namespace: item.ResourcePool }}
        data-cy={`application-link-${item.Name}`}
      >
        {item.Name}
      </Link>

      {isSystem ? (
        <SystemBadge className="ml-auto" />
      ) : (
        isExternalApplication({ metadata: item.Metadata }) && (
          <ExternalBadge className="ml-auto" />
        )
      )}
    </div>
  );
}
