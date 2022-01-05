import { Column } from 'react-table';

import { Environment } from "Portainer/environments/types";
import { DefaultFilter } from 'Portainer/components/datatables/components/Filter';

export const state: Column<Environment> = {
  Header: 'State',
  accessor: 'Status',
  id: 'state',
  Cell: StatusCell,
  sortType: 'string',
  filter: 'multiple',
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
