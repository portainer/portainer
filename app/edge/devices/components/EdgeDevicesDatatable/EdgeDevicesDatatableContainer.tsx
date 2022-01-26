import { react2angular } from '@/react-tools/react2angular';
import { TableSettingsProvider } from '@/portainer/components/datatables/components/useTableSettings';

import {
  EdgeDevicesDatatable,
  EdgeDevicesTableProps,
} from './EdgeDevicesDatatable';

export function EdgeDevicesDatatableContainer({
  ...props
}: EdgeDevicesTableProps) {
  const defaultSettings = {
    autoRefreshRate: 0,
    hiddenQuickActions: [],
    hiddenColumns: [],
    pageSize: 10,
    sortBy: { id: 'state', desc: false },
  };

  return (
    <TableSettingsProvider defaults={defaultSettings} storageKey="edgeDevices">
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <EdgeDevicesDatatable {...props} />
    </TableSettingsProvider>
  );
}

export const EdgeDevicesDatatableAngular = react2angular(
  EdgeDevicesDatatableContainer,
  [
    'dataset',
    'onRefresh',
    'setLoadingMessage',
    'isFdoEnabled',
    'disableTrustOnFirstConnect',
    'isOpenAmtEnabled',
    'mpsServer',
  ]
);
