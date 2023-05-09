import { columnHelper } from './helper';

export const clusterIP = columnHelper.accessor(
  (row) => row.ClusterIPs?.join(','),
  {
    header: 'Cluster IP',
    id: 'clusterIP',
    cell: ({ row }) => {
      const clusterIPs = row.original.ClusterIPs;

      if (!clusterIPs?.length) {
        return '-';
      }
      return clusterIPs.map((ip) => <div key={ip}>{ip}</div>);
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.ClusterIPs;
      const b = rowB.original.ClusterIPs;

      const ipA = a?.[0];
      const ipB = b?.[0];

      // no ip's at top, followed by 'None', then ordered by ip
      if (!ipA) return 1;
      if (!ipB) return -1;
      if (ipA === ipB) return 0;
      if (ipA === 'None') return 1;
      if (ipB === 'None') return -1;

      // natural sort of the ip
      return ipA.localeCompare(
        ipB,
        navigator.languages[0] || navigator.language,
        {
          numeric: true,
          ignorePunctuation: true,
        }
      );
    },
  }
);
