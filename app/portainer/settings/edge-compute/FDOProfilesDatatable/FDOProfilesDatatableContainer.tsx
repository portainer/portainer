import { TableSettingsProvider } from '@/portainer/components/datatables/components/useTableSettings';
import { SearchBarProvider } from '@/portainer/components/datatables/components/SearchBar';

import {
  FDOProfilesDatatable,
    FDOProfilesTableProps,
} from './FDOProfilesDatatable';

export function FDOProfilesDatatableContainer({
  ...props
}: FDOProfilesTableProps) {
  const defaultSettings = {
    pageSize: 10,
    sortBy: { id: 'name', desc: false },
  };

  return (
    <TableSettingsProvider defaults={defaultSettings} storageKey="edgeDevices">
      <SearchBarProvider>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <FDOProfilesDatatable {...props} />
      </SearchBarProvider>
    </TableSettingsProvider>
  );
}