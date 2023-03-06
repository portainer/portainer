import { CellProps, Column } from 'react-table';

import { Tooltip } from '@@/Tip/Tooltip';

import { Service } from '../../types';

export const ports: Column<Service> = {
  Header: () => (
    <>
      Ports
      <Tooltip message="The format of Ports is port[:nodePort]/protocol. Protocol is either TCP, UDP or SCTP." />
    </>
  ),

  id: 'ports',
  accessor: (row) => {
    const ports = row.Ports;
    return ports.map(
      (port) => `${port.Port}:${port.NodePort}/${port.Protocol}`
    );
  },
  Cell: ({ row }: CellProps<Service>) => {
    if (!row.original.Ports.length) {
      return '-';
    }

    return (
      <>
        {row.original.Ports.map((port, index) => {
          if (port.NodePort !== 0) {
            return (
              <div key={index}>
                {port.Port}:{port.NodePort}/{port.Protocol}
              </div>
            );
          }

          return (
            <div key={index}>
              {port.Port}/{port.Protocol}
            </div>
          );
        })}
      </>
    );
  },
  disableFilters: true,
  canHide: true,

  sortType: (rowA, rowB) => {
    const a = rowA.original.Ports;
    const b = rowB.original.Ports;

    if (!a.length && !b.length) return 0;

    if (!a.length) return 1;
    if (!b.length) return -1;

    // sort order based on first port
    const portA = a[0].Port;
    const portB = b[0].Port;

    if (portA === portB) {
      // longer list of ports is considered "greater"
      if (a.length < b.length) return -1;
      if (a.length > b.length) return 1;
      return 0;
    }

    // now do a regular number sort
    if (portA < portB) return -1;
    if (portA > portB) return 1;

    return 0;
  },
};
