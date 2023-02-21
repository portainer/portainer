import { CellProps, Column, Row } from 'react-table';
import { List, Share2 } from 'lucide-react';

import { Icon } from '@@/Icon';
import { filterHOC } from '@@/datatables/Filter';

import { Service } from '../../types';

export const type: Column<Service> = {
  Header: 'Type',
  id: 'type',
  accessor: (row) => row.Type,
  Cell: ({ row }: CellProps<Service>) => {
    const icon = getIcon(row.original.Type);
    return (
      <span className="flex items-center space-x-1">
        <Icon icon={icon} aria-hidden="true" />
        <div>{row.original.Type}</div>
      </span>
    );
  },
  canHide: true,

  disableFilters: false,
  Filter: filterHOC('Filter by type'),
  filter: (rows: Row<Service>[], _filterValue, filters) => {
    if (filters.length === 0) {
      return rows;
    }
    return rows.filter((r) => filters.includes(r.original.Type));
  },
};

function getIcon(type?: string) {
  switch (type) {
    case 'ClusterIP':
      return List;
    case 'ExternalName':
      return List;
    case 'NodePort':
      return List;
    case 'LoadBalancer':
      return Share2;
    default:
      return List;
  }
}
