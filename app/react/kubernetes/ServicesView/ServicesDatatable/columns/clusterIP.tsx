import { CellProps, Column } from 'react-table';

import { Service } from '../../types';

export const clusterIP: Column<Service> = {
  Header: 'Cluster IP',
  accessor: 'ClusterIPs',
  id: 'clusterIP',
  Cell: ({ value: clusterIPs }: CellProps<Service, Service['ClusterIPs']>) => {
    if (!clusterIPs?.length) {
      return '-';
    }
    return clusterIPs.map((ip) => <div key={ip}>{ip}</div>);
  },
  disableFilters: true,
  canHide: true,
  sortType: (rowA, rowB) => {
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
};
