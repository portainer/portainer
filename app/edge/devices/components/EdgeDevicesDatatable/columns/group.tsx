import { Column } from 'react-table';
import {Environment} from "Portainer/environments/types";
import { DefaultFilter } from 'Portainer/components/datatables/components/Filter';

export const group: Column<Environment> = {
  Header: 'Group',
  accessor: (row) => row.GroupName || '-',
  id: 'groupName',
  Filter: DefaultFilter,
  canHide: true,
};





