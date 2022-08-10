import { CellProps, Column } from 'react-table';

import { useAuthorizations } from '@/portainer/hooks/useUser';
import { ContainerQuickActions } from '@/react/docker/containers/components/ContainerQuickActions/ContainerQuickActions';
import type {
  ContainersTableSettings,
  DockerContainer,
} from '@/react/docker/containers/types';
import { useCurrentEnvironment } from '@/portainer/hooks/useCurrentEnvironment';
import { isOfflineEndpoint } from '@/portainer/helpers/endpointHelper';

import { useTableSettings } from '@@/datatables/useTableSettings';

export const quickActions: Column<DockerContainer> = {
  Header: 'Quick Actions',
  id: 'actions',
  Cell: QuickActionsCell,
  disableFilters: true,
  disableSortBy: true,
  canHide: true,
  sortType: 'string',
  Filter: () => null,
};

function QuickActionsCell({
  row: { original: container },
}: CellProps<DockerContainer>) {
  const environmentQuery = useCurrentEnvironment();

  const environment = environmentQuery.data;
  const offlineMode = !environment || isOfflineEndpoint(environment);

  const { settings } = useTableSettings<ContainersTableSettings>();

  const { hiddenQuickActions = [] } = settings;

  const wrapperState = {
    showQuickActionAttach: !hiddenQuickActions.includes('attach'),
    showQuickActionExec: !hiddenQuickActions.includes('exec'),
    showQuickActionInspect: !hiddenQuickActions.includes('inspect'),
    showQuickActionLogs: !hiddenQuickActions.includes('logs'),
    showQuickActionStats: !hiddenQuickActions.includes('stats'),
  };

  const someOn =
    wrapperState.showQuickActionAttach ||
    wrapperState.showQuickActionExec ||
    wrapperState.showQuickActionInspect ||
    wrapperState.showQuickActionLogs ||
    wrapperState.showQuickActionStats;

  const isAuthorized = useAuthorizations([
    'DockerContainerStats',
    'DockerContainerLogs',
    'DockerExecStart',
    'DockerContainerInspect',
    'DockerTaskInspect',
    'DockerTaskLogs',
  ]);

  if (offlineMode || !someOn || !isAuthorized) {
    return null;
  }

  return (
    <ContainerQuickActions
      containerId={container.Id}
      nodeName={container.NodeName}
      status={container.Status}
      state={wrapperState}
    />
  );
}
