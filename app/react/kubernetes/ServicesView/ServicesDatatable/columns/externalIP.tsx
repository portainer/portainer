import { CellProps, Column } from 'react-table';

import { Service } from '../../types';

import { ExternalIPLink } from './externalIPLink';

// calculate the scheme based on the ports of the service
// favour https over http.
function getSchemeAndPort(svc: Service): [string, number] {
  let scheme = '';
  let servicePort = 0;

  svc.Ports?.forEach((port) => {
    if (port.Protocol === 'TCP') {
      switch (port.TargetPort) {
        case '443':
        case '8443':
        case 'https':
          scheme = 'https';
          servicePort = port.Port;
          break;

        case '80':
        case '8080':
        case 'http':
          if (scheme !== 'https') {
            scheme = 'http';
            servicePort = port.Port;
          }
          break;

        default:
          break;
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

        return (
          <div key={index}>
            <ExternalIPLink to={linkto} text={status.IP} />
          </div>
        );
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

    // use a nat sort order for ip addresses
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
