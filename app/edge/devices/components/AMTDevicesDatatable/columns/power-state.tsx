import { Column } from 'react-table';
import { Device } from "Portainer/hostmanagement/open-amt/model";

export const powerState: Column<Device> = {
  Header: 'Power State',
  accessor: (row) => row.powerState || '-', // TODO mrydel parse
  id: 'powerstate',
  disableFilters: true,
  canHide: true,
  sortType: 'string',
  Filter: () => null,
};

