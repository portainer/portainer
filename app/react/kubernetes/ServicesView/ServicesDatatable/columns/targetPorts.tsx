import { columnHelper } from './helper';

export const targetPorts = columnHelper.accessor(
  (row) => row.Ports.map((port) => port.TargetPort).join(','),
  {
    header: 'Target Ports',
    id: 'targetPorts',
    cell: ({ row }) => {
      const ports = row.original.Ports.map((port) => port.TargetPort);
      if (!ports.length) {
        return '-';
      }

      return ports.map((port, index) => <div key={index}>{port}</div>);
    },
    sortingFn: (rowA, rowB) => {
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
  }
);
