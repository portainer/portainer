import { Column } from 'react-table';
import { Device } from "Portainer/hostmanagement/open-amt/model";

export const status: Column<Device> = {
  Header: 'MPS Status',
  accessor: (row) => row.connectionStatus ? 'Connected' : 'Disconnected',
  id: 'status',
  disableFilters: true,
  canHide: true,
  sortType: 'string',
  Filter: () => null,
};

