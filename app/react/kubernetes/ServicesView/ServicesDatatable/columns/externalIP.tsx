import { CellProps, Column } from 'react-table';

import { Service } from '../../types';

import { ExternalIPLink } from './externalIPLink';

// calculate the scheme based on the ports of the service
// favour https over http
function getSchemeAndPort(svc: Service): [string, number] {
  let scheme = '';
  let servicePort = 0;

  svc.Ports?.forEach((port) => {
    if (port.Protocol === 'TCP') {
      if (port.TargetPort === 'https' || port.TargetPort === '443') {
        scheme = 'https';
        servicePort = port.Port;
      }

      if (
        (port.TargetPort === 'http' || port.TargetPort === '80') &&
        scheme !== 'https'
      ) {
        scheme = 'http';
        servicePort = port.Port;
      }
    }
  });

  return [scheme, servicePort];
}

export const externalIP: Column<Service> = {
  Header: 'External IP',
  id: 'externalIP',
  accessor: (row) => row.IngressStatus?.slice(0),
  Cell: ({ row }: CellProps<Service>) => {
    const isExternalName = row.original.Type === 'ExternalName';
    if (isExternalName) {
      if (!row.original.ExternalName) {
        return '-';
      }

      const linkto = `http://${row.original.ExternalName}`;
      return <ExternalIPLink to={linkto} text={row.original.ExternalName} />;
    }

    const status = row.original.IngressStatus;
    if (!status?.length) {
      return '-';
    }

    const [scheme, port] = getSchemeAndPort(row.original);
    return status.map((status, index) => {
      if (scheme) {
        let linkto = `${scheme}://${status.IP}`;
        if (port !== 80 && port !== 443) {
          linkto = `${linkto}:${port}`;
        }

        return <ExternalIPLink key={index} to={linkto} text={status.IP} />;
      }

      return <div key={index}>{status.IP}</div>;
    });
  },
  disableFilters: true,
  canHide: true,
  sortType: (rowA, rowB) => {
    const a = rowA.original.IngressStatus;
    const b = rowB.original.IngressStatus;

    let ipA = a?.[0].IP;
    let ipB = b?.[0].IP;

    if (!ipA && rowA.original.Type === 'ExternalName') {
      ipA = rowA.original.ExternalName;
    }

    if (!ipB && rowB.original.Type === 'ExternalName') {
      ipB = rowB.original.ExternalName;
    }

    if (!ipA) return 1;
    if (!ipB) return -1;

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
