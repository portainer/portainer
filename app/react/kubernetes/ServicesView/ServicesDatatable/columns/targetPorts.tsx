import { CellProps, Column } from 'react-table';

import { Service } from '../../types';

export const targetPorts: Column<Service> = {
  Header: 'Target Ports',
  id: 'targetPorts',
  accessor: (row) => {
    const ports = row.Ports;
    if (!ports.length) {
      return '-';
    }
    return ports.map((port) => `${port.TargetPort}`);
  },
  Cell: ({ row }: CellProps<Service>) => {
    const ports = row.original.Ports;
    if (!ports.length) {
      return '-';
    }
    return ports.map((port, index) => <div key={index}>{port.TargetPort}</div>);
  },
  disableFilters: true,
  canHide: true,

  sortType: (rowA, rowB) => {
    const a = rowA.original.Ports;
    const b = rowB.original.Ports;

    if (!a.length && !b.length) return 0;
    if (!a.length) return 1;
    if (!b.length) return -1;

    const portA = a[0].TargetPort;
    const portB = b[0].TargetPort;

    if (portA === portB) {
      if (a.length < b.length) return -1;
      if (a.length > b.length) return 1;

      return 0;
    }

    // natural sort of the port
    return portA.localeCompare(
      portB,
      navigator.languages[0] || navigator.language,
      {
        numeric: true,
        ignorePunctuation: true,
      }
    );
  },
};
