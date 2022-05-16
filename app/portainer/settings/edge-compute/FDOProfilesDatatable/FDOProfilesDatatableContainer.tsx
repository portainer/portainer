import { TableSettingsProvider } from '@/react/components/datatables/useTableSettings';

import {
  FDOProfilesDatatable,
  FDOProfilesDatatableProps,
} from './FDOProfilesDatatable';

export function FDOProfilesDatatableContainer({
  ...props
}: FDOProfilesDatatableProps) {
  const defaultSettings = {
    pageSize: 10,
    sortBy: { id: 'name', desc: false },
  };

  return (
    <TableSettingsProvider defaults={defaultSettings} storageKey="fdoProfiles">
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <FDOProfilesDatatable {...props} />
    </TableSettingsProvider>
  );
}
