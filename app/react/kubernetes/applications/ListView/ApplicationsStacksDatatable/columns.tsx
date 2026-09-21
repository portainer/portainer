import { FileText } from 'lucide-react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';

import { useIsSystemNamespace } from '@/react/kubernetes/namespaces/queries/useIsSystemNamespace';

import { buildExpandColumn } from '@@/datatables/expand-column';
import { Link } from '@@/Link';
import { Icon } from '@@/Icon';
import { SystemBadge } from '@@/Badge/SystemBadge';

import { Stack } from './types';

export const columnHelper = createColumnHelper<Stack>();

// a stack has no namespace of its own, so it's taken from its applications
function getNamespaces(stack: Stack) {
  return [...new Set(stack.Applications.map((app) => app.ResourcePool))];
}

const namespace = columnHelper.accessor(
  (row) => getNamespaces(row).join(', '),
  {
    id: 'namespace',
    header: 'Namespace',
    cell: NamespaceCell,
  }
);

function NamespaceCell({ row }: CellContext<Stack, string>) {
  const namespaces = getNamespaces(row.original);

  return (
    <div className="flex flex-wrap items-center">
      {namespaces.map((namespace, index) => (
        <NamespaceLink
          key={namespace}
          namespace={namespace}
          stackName={row.original.Name}
          isLast={index === namespaces.length - 1}
        />
      ))}
    </div>
  );
}

function NamespaceLink({
  namespace,
  stackName,
  isLast,
}: {
  namespace: string;
  stackName: string;
  isLast: boolean;
}) {
  const isSystem = useIsSystemNamespace(namespace);

  return (
    <span className="flex items-center">
      <Link
        to="kubernetes.resourcePools.resourcePool"
        params={{ id: namespace }}
        data-cy={`app-stack-namespace-link-${stackName}`}
      >
        {namespace}
      </Link>
      {isSystem && <SystemBadge className="ml-1" />}
      {!isLast && <span className="mr-1">,</span>}
    </span>
  );
}

const name = columnHelper.accessor('Name', {
  id: 'name',
  header: 'Stack',
});

const applications = columnHelper.accessor((row) => row.Applications.length, {
  id: 'applications',
  header: 'Applications',
});

const actions = columnHelper.display({
  id: 'actions',
  header: 'Actions',
  cell: ({ row: { original: item } }) => (
    <Link
      to="kubernetes.stacks.stack.logs"
      params={{ namespace: getNamespaces(item)[0], name: item.Name }}
      className="flex items-center gap-1"
      data-cy={`app-stack-logs-link-${item.Name}`}
    >
      <Icon icon={FileText} />
      Logs
    </Link>
  ),
});

export const columns = [
  buildExpandColumn<Stack>(),
  name,
  namespace,
  applications,
  actions,
];
