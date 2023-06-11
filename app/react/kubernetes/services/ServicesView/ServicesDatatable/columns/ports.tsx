import { Tooltip } from '@@/Tip/Tooltip';

import { columnHelper } from './helper';

export const ports = columnHelper.accessor(
  (row) =>
    row.Ports.map(
      (port) =>
        `${port.Port}${port.NodePort !== 0 ? `:${port.NodePort}` : ''}/${
          port.Protocol
        }`
    ).join(',') || '-',
  {
    header: () => (
      <>
        Ports
        <Tooltip message="The format of Ports is port[:nodePort]/protocol. Protocol is either TCP, UDP or SCTP." />
      </>
    ),
    id: 'ports',
    cell: ({ row }) => {
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
    sortingFn: (rowA, rowB) => {
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
  }
);
