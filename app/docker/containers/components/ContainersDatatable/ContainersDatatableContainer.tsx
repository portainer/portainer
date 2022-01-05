import { react2angular } from '@/react-tools/react2angular';
import { EnvironmentProvider } from '@/portainer/environments/useEnvironment';
import { TableSettingsProvider } from '@/portainer/components/datatables/components/useTableSettings';
import type { Environment } from '@/portainer/environments/types';

import {
  ContainersDatatable,
  ContainerTableProps,
} from './ContainersDatatable';

interface Props extends ContainerTableProps {
  endpoint: Environment;
}

export function ContainersDatatableContainer({
  endpoint,
  tableKey = 'containers',
  ...props
}: Props) {
  const defaultSettings = {
    autoRefreshRate: 0,
    truncateContainerName: 32,
    hiddenQuickActions: [],
    hiddenColumns: [],
    pageSize: 10,
    sortBy: { id: 'state', desc: false },
  };

  return (
    <EnvironmentProvider environment={endpoint}>
      <TableSettingsProvider defaults={defaultSettings} storageKey={tableKey}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <ContainersDatatable {...props} />
      </TableSettingsProvider>
    </EnvironmentProvider>
  );
}

export const ContainersDatatableAngular = react2angular(
  ContainersDatatableContainer,
  [
    'endpoint',
    'isAddActionVisible',
    'dataset',
    'onRefresh',
    'isHostColumnVisible',
    'tableKey',
  ]
);
