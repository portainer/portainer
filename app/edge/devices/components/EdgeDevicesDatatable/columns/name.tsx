import { CellProps, Column, TableInstance } from 'react-table';
import { Environment } from "Portainer/environments/types";
import {Link} from "Portainer/components/Link";

export const name: Column<Environment> = {
  Header: 'Name',
  accessor: (row) => row.Name,
  id: 'name',
  Cell: NameCell,
  disableFilters: true,
  Filter: () => null,
  canHide: true,
  sortType: 'string',
};

export function NameCell({
  value: name,
  row,
}: CellProps<TableInstance>) {
  return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <a {...row.getToggleRowExpandedProps({})} >
        <i className={`fas ${arrowHelper(row.isExpanded)} space-right`} aria-hidden="true" />
        <Link to="portainer.endpoints.endpoint" params={{ id: row.original.Id }} title={name}>
          {name}
        </Link>
      </a>
  );

  function arrowHelper(isExpanded: boolean) {
    if (isExpanded) {
      return 'fa-angle-down';
    }
    return 'fa-angle-right'
  }

}
