import { Users } from 'lucide-react';

import { Datatable } from '@@/datatables';
import { useTableStateWithoutStorage } from '@@/datatables/useTableState';

const columns = getColumns();

interface Value {
  value: string;
}

export function LDAPUsersTable({ dataset }: { dataset?: string[] }) {
  const tableState = useTableStateWithoutStorage();
  const items = dataset?.map((value) => ({ value }));

  return (
    <Datatable
      columns={columns}
      dataset={items || []}
      isLoading={!items}
      title="Users"
      titleIcon={Users}
      settingsManager={tableState}
      disableSelect
      data-cy="ldap-users-datatable"
    />
  );
}

function getColumns() {
  return [
    {
      header: 'Name',
      accessorFn: ({ value }: Value) => value,
    },
  ];
}
