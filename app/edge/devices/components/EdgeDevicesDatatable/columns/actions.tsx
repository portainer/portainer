import {CellProps, Column, TableInstance} from 'react-table';
import {Environment} from "Portainer/environments/types";
import { MenuItem } from "@reach/menu-button";
import {ActionsMenu} from "Portainer/components/datatables/components/ActionsMenu";

export const actions: Column<Environment> = {
  Header: 'Actions',
  accessor: () => 'actions',
  id: 'actions',
  disableFilters: true,
  canHide: true,
  sortType: 'string',
  Filter: () => null,
  Cell: ActionsCell,
};

export function ActionsCell() {

  return (
      <ActionsMenu>
        <div>
          <MenuItem onSelect={() => {}}>Browse</MenuItem>
          <MenuItem onSelect={() => {}}>Refresh Snapshot</MenuItem>
        </div>
      </ActionsMenu>
  )
}
