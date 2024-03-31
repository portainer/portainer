import { FileText } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';

import KubernetesNamespaceHelper from '@/kubernetes/helpers/namespaceHelper';

import { buildExpandColumn } from '@@/datatables/expand-column';
import { Link } from '@@/Link';
import { Icon } from '@@/Icon';
import { SystemBadge } from '@@/Badge/SystemBadge';

import { KubernetesStack } from '../../types';

export const columnHelper = createColumnHelper<KubernetesStack>();

export const columns = [
  buildExpandColumn<KubernetesStack>(),
  columnHelper.accessor('Name', {
    id: 'name',
    header: 'Stack',
  }),
  columnHelper.accessor('ResourcePool', {
    id: 'namespace',
    header: 'Namespace',
    cell: ({ getValue }) => {
      const value = getValue();
      return (
        <div className="flex gap-2">
          <Link
            to="kubernetes.resourcePools.resourcePool"
            params={{ id: value }}
          >
            {value}
          </Link>
          {KubernetesNamespaceHelper.isSystemNamespace(value) && (
            <SystemBadge />
          )}
        </div>
      );
    },
  }),

  columnHelper.accessor((row) => row.Applications.length, {
    id: 'applications',
    header: 'Applications',
  }),

  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row: { original: item } }) => (
      <Link
        to="kubernetes.stacks.stack.logs"
        params={{ namespace: item.ResourcePool, name: item.Name }}
        className="flex items-center gap-1"
      >
        <Icon icon={FileText} />
        Logs
      </Link>
    ),
  }),
];
