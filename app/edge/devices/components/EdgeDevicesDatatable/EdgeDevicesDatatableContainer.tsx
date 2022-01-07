import { TableSettingsProvider } from 'Portainer/components/datatables/components/useTableSettings';
import { SearchBarProvider } from 'Portainer/components/datatables/components/SearchBar';

import { react2angular } from '@/react-tools/react2angular';

import {
    EdgeDevicesDatatable,
  EdgeDevicesTableProps,
} from './EdgeDevicesDatatable';

export function EdgeDevicesDatatableContainer({ ...props }: EdgeDevicesTableProps) {
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
    'dataset',
    'onRefresh',
      'setLoadingMessage',
    'isOpenAmtEnabled',
      'isFdoEnabled',
  ]
);
