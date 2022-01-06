import { Column } from 'react-table';
import { Device } from "Portainer/hostmanagement/open-amt/model";

export const status: Column<Device> = {
  Header: 'MPS Status',
  accessor: (row) => row.connectionStatus || '-', // TODO mrydel parse
  id: 'status',
  disableFilters: true,
  canHide: true,
  sortType: 'string',
  Filter: () => null,
};

