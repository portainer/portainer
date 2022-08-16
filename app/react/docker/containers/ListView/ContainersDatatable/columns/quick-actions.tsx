import { CellProps, Column } from 'react-table';

import { useAuthorizations } from '@/portainer/hooks/useUser';
import { isOfflineEndpoint } from '@/portainer/helpers/endpointHelper';
import { useCurrentEnvironment } from '@/portainer/hooks/useCurrentEnvironment';
import { ContainerQuickActions } from '@/react/docker/containers/components/ContainerQuickActions';
import { DockerContainer } from '@/react/docker/containers/types';

import { useTableSettings } from '@@/datatables/useZustandTableSettings';

import { TableSettings } from '../types';

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

  const { settings } = useTableSettings<TableSettings>();

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
