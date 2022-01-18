import { TableSettingsProvider } from '@/portainer/components/datatables/components/useTableSettings';

import { FDOProfilesDatatable } from './FDOProfilesDatatable';

export function FDOProfilesDatatableContainer() {
  const defaultSettings = {
    pageSize: 10,
    sortBy: { id: 'name', desc: false },
  };

  return (
    <TableSettingsProvider defaults={defaultSettings} storageKey="edgeDevices">
      <FDOProfilesDatatable />
    </TableSettingsProvider>
  );
}
