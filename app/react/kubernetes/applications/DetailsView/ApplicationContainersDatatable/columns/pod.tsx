import { createColumnHelper } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';
import { formatDate } from '@/portainer/filters/filters';
import { pluralize } from '@/react/common/string-utils';

import { Badge } from '@@/Badge';
import { Tooltip } from '@@/Tip/Tooltip';
import { Link } from '@@/Link';
import { Icon } from '@@/Icon';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';
import { LoadingButton } from '@@/buttons';
import { confirmDelete } from '@@/modals/confirm';

import { PodRowData } from '../types';

const columnHelper = createColumnHelper<PodRowData>();

const pod = columnHelper.accessor('podName', {
  header: 'Pod',
  id: 'podName',
  cell: ({ row: { original: podRow } }) => {
    const statusData = podRow.status;
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate" title={podRow.podName}>
          {podRow.podName}
        </span>
        <Badge type={statusData.type}>
          <span>
            {statusData.status}
            {statusData.restartCount
              ? ` (Restarted ${statusData.restartCount} ${pluralize(
                  statusData.restartCount,
                  'time'
                )})`
              : ''}
          </span>
          {statusData.message && <Tooltip message={statusData.message} />}
        </Badge>
      </div>
    );
  },
});

const node = columnHelper.accessor('nodeName', {
  header: 'Node',
  cell: ({ getValue }) => {
    const nodeName = getValue();
    return (
      <Authorized
        authorizations="K8sClusterNodeR"
        childrenUnauthorized={nodeName}
      >
        <Link
          to="kubernetes.cluster.node"
          params={{ nodeName }}
          data-cy={`application-container-node-${nodeName}`}
        >
          <div className="max-w-xs truncate" title={nodeName}>
            {nodeName}
          </div>
        </Link>
      </Authorized>
    );
  },
});

const podIp = columnHelper.accessor('podIp', {
  header: 'Pod IP',
  id: 'podIp',
});

const containers = columnHelper.accessor(
  (row) => `${row.readyContainers}/${row.totalContainers}`,
  {
    id: 'containers',
    header: 'Containers',
    enableSorting: false,
  }
);

const creationDate = columnHelper.accessor(
  (row) => formatDate(row.creationDate),
  {
    header: 'Creation Date',
    cell: ({ getValue }) => getValue(),
  }
);

export const podColumns = [pod, node, podIp, containers, creationDate];

interface PodColumnsOptions {
  supportsRestartStrategy: boolean;
  onDelete: (podName: string) => void;
  isDeleting: boolean;
  isLoading: boolean;
}

export function getPodColumns({
  supportsRestartStrategy,
  onDelete,
  isDeleting,
  isLoading,
}: PodColumnsOptions) {
  const deleteTooltip = supportsRestartStrategy
    ? 'Delete pod. If this pod is configured with the RestartAllContainers restart strategy, containers will restart in-place automatically.'
    : 'Delete pod';

  const actions = columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row: { original: podRow } }) => (
      <Authorized authorizations="K8sApplicationsP">
        <div className="flex gap-x-2">
          <TooltipWithChildren message={deleteTooltip} position="top">
            <LoadingButton
              color="dangerlight"
              className="!ml-0"
              aria-label={`Delete pod ${podRow.podName}`}
              isLoading={isLoading || isDeleting}
              loadingText="Loading"
              data-cy={`application-pod-delete-${podRow.podName}`}
              onClick={async () => {
                const confirmed = await confirmDelete(
                  `Are you sure you want to delete pod '${podRow.podName}'? Kubernetes will reschedule a new pod to replace it.`
                );
                if (!confirmed) {
                  return;
                }
                onDelete(podRow.podName);
              }}
            >
              <Icon icon={Trash2} />
            </LoadingButton>
          </TooltipWithChildren>
        </div>
      </Authorized>
    ),
  });

  return [pod, node, podIp, containers, creationDate, actions];
}
