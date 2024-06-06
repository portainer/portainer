import { Users } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';

import { Datatable } from '@@/datatables';
import { useTableStateWithoutStorage } from '@@/datatables/useTableState';

const columns = getColumns();

interface Value {
  Name: string;
  Groups: string[];
}

export function LDAPGroupsTable({ dataset }: { dataset?: Value[] }) {
  const tableState = useTableStateWithoutStorage();

  return (
    <Datatable
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      title="Groups"
      titleIcon={Users}
      settingsManager={tableState}
      disableSelect
      data-cy="ldap-groups-datatable"
    />
  );
}

function getColumns() {
  const helper = createColumnHelper<Value>();

  return [
    helper.accessor('Name', {}),
    helper.accessor((item) => item.Groups.join(','), {
      header: 'Groups',
      cell: ({ row: { original: item } }) => (
        <>
          {item.Groups.map((g) => (
            <p className="m-0" key={g}>
              {g}
            </p>
          ))}
        </>
      ),
    }),
  ];
}
