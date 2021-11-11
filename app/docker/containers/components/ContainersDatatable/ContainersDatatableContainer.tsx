import { react2angular } from '@/react-tools/react2angular';
import { EndpointProvider } from '@/portainer/endpoints/useEndpoint';
import { TableSettingsProvider } from '@/portainer/components/datatables/components/useTableSettings';
import { SearchBarProvider } from '@/portainer/components/datatables/components/SearchBar';
import type { Endpoint } from '@/portainer/endpoints/types';

import {
  ContainersDatatable,
  ContainerTableProps,
} from './ContainersDatatable';

interface Props extends ContainerTableProps {
  endpoint: Endpoint;
}

export function ContainersDatatableContainer({ endpoint, ...props }: Props) {
  const defaultSettings = {
    autoRefreshRate: 0,
    truncateContainerName: 32,
    hiddenQuickActions: [],
    hiddenColumns: [],
    pageSize: 10,
    sortBy: { id: 'state', desc: false },
  };

  return (
    <EndpointProvider endpoint={endpoint}>
      <TableSettingsProvider defaults={defaultSettings} storageKey="containers">
        <SearchBarProvider>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <ContainersDatatable {...props} />
        </SearchBarProvider>
      </TableSettingsProvider>
    </EndpointProvider>
  );
}

export const ContainersDatatableAngular = react2angular(
  ContainersDatatableContainer,
  [
    'endpoint',
    'isAddActionVisible',
    'containerService',
    'httpRequestHelper',
    'notifications',
    'modalService',
    'dataset',
    'onRefresh',
    'isHostColumnVisible',
    'autoFocusSearch',
  ]
);
