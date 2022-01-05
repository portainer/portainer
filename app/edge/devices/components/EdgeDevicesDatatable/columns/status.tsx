import { Column } from 'react-table';
import { Environment } from "Portainer/environments/types";
import { DefaultFilter } from 'Portainer/components/datatables/components/Filter';

export const status: Column<Environment> = {
  Header: 'Status',
  accessor: (row) => row.Status || '-',
  id: 'status',
  Cell: StatusCell,
  Filter: DefaultFilter,
  canHide: true,
};

function StatusCell({ value: status }: { value: string }) {
  return (
    <span>
      {status}
    </span>
  );
}
