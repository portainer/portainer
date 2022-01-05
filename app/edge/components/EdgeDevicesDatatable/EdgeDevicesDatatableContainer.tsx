import { react2angular } from '@/react-tools/react2angular';
import { TableSettingsProvider } from '@/portainer/components/datatables/components/useTableSettings';
import { SearchBarProvider } from '@/portainer/components/datatables/components/SearchBar';

import {
    EdgeDevicesDatatable,
  EdgeDevicesTableProps,
} from './EdgeDevicesDatatable';

export function EdgeDevicesDatatableContainer({ ...props }: EdgeDevicesTableProps) {

    console.log("EdgeDevicesDatatableContainer:");

    const defaultSettings = {
    autoRefreshRate: 0,
    hiddenQuickActions: [],
    hiddenColumns: [],
    pageSize: 10,
    sortBy: { id: 'state', desc: false },
  };

  return (
      <TableSettingsProvider defaults={defaultSettings} storageKey="edgeDevices">
        <SearchBarProvider>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <EdgeDevicesDatatable {...props} />
        </SearchBarProvider>
      </TableSettingsProvider>
  );
}

export const EdgeDevicesDatatableAngular = react2angular(
  EdgeDevicesDatatableContainer,
  [
    'endpointService',
    'httpRequestHelper',
    'notifications',
    'modalService',
    'dataset',
    'onRefresh',
    'isAddActionVisible',
    'autoFocusSearch',
  ]
);
