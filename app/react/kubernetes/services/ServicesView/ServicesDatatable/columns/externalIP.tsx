import { CellContext } from '@tanstack/react-table';

import { ServiceRowData } from '../types';

import { ExternalIPLink } from './ExternalIPLink';
import { columnHelper } from './helper';

export const externalIP = columnHelper.accessor(
  (row) => {
    if (row.Type === 'ExternalName') {
      return row.ExternalName || '';
    }

    if (row.ExternalIPs?.length) {
      return row.ExternalIPs?.join(',') || '';
    }

    return row.IngressStatus?.map((status) => status.IP).join(',') || '';
  },
  {
    header: 'External IP',
    id: 'externalIP',
    cell: Cell,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.IngressStatus;
      const b = rowB.original.IngressStatus;
      const aExternal = rowA.original.ExternalIPs;
      const bExternal = rowB.original.ExternalIPs;

      const ipA = a?.[0].IP || aExternal?.[0] || rowA.original.ExternalName;
      const ipB = b?.[0].IP || bExternal?.[0] || rowA.original.ExternalName;

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
  }
);

function Cell({ row }: CellContext<ServiceRowData, string>) {
  if (row.original.Type === 'ExternalName') {
    if (row.original.ExternalName) {
      const linkTo = `http://${row.original.ExternalName}`;
      return <ExternalIPLink to={linkTo} text={row.original.ExternalName} />;
    }
    return '-';
  }

  const [scheme, port] = getSchemeAndPort(row.original);
  if (row.original.ExternalIPs?.length) {
    return row.original.ExternalIPs?.map((ip, index) => {
      // some ips come through blank
      if (ip.length === 0) {
        return '-';
      }

      if (scheme) {
        let linkTo = `${scheme}://${ip}`;
        if (port !== 80 && port !== 443) {
          linkTo = `${linkTo}:${port}`;
        }
        return (
          <div key={index}>
            <ExternalIPLink to={linkTo} text={ip} />
          </div>
        );
      }
      return <div key={index}>{ip}</div>;
    });
  }

  const status = row.original.IngressStatus;
  if (status) {
    return status?.map((status, index) => {
      // some ips come through blank
      if (status.IP.length === 0) {
        return '-';
      }

      if (scheme) {
        let linkTo = `${scheme}://${status.IP}`;
        if (port !== 80 && port !== 443) {
          linkTo = `${linkTo}:${port}`;
        }
        return (
          <div key={index}>
            <ExternalIPLink to={linkTo} text={status.IP} />
          </div>
        );
      }
      return <div key={index}>{status.IP}</div>;
    });
  }

  return '-';
}

// calculate the scheme based on the ports of the service
// favour https over http.
function getSchemeAndPort(svc: ServiceRowData): [string, number] {
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
