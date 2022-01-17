import { TableSettingsProvider } from '@/portainer/components/datatables/components/useTableSettings';
import { useFDOProfiles } from '@/portainer/settings/edge-compute/FDOProfilesDatatable/useFDOProfiles';

import { FDOProfilesDatatable } from './FDOProfilesDatatable';

export function FDOProfilesDatatableContainer() {
  const defaultSettings = {
    pageSize: 10,
    sortBy: { id: 'name', desc: false },
  };

  // TODO mrydel use single component (like AMT)
  const { isLoading, profiles, error } = useFDOProfiles();

  return (
    <TableSettingsProvider defaults={defaultSettings} storageKey="edgeDevices">
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <FDOProfilesDatatable
        profiles={profiles}
        isLoading={isLoading}
        error={error}
      />
    </TableSettingsProvider>
  );
}
