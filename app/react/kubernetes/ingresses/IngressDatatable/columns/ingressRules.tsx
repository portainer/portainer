import { CellContext } from '@tanstack/react-table';
import { AlertTriangle, ArrowRight } from 'lucide-react';

import { Icon } from '@@/Icon';
import { Badge } from '@@/Badge';

import { Ingress, TLS } from '../../types';

import { columnHelper } from './helper';

export const ingressRules = columnHelper.accessor(
  ({ Paths, TLS }) =>
    // return an accessor function with all the useful text to search for
    Paths?.map((path) => {
      const isHttp = isHTTP(TLS || [], path.Host);
      return `${isHttp ? 'http' : 'https'}://${path.Host}${path.Path}${
        path.ServiceName
      }:${path.Port} ${!path.HasService && "Service doesn't exist"}`;
    }).join(','),
  {
    header: 'Rules and Paths',
    id: 'ingressRules',
    cell: Cell,
  }
);

function Cell({ row }: CellContext<Ingress, string>) {
  const paths = row.original.Paths;

  if (!paths) {
    return <div />;
  }

  return (
    <div className="flex flex-col gap-y-0.5 whitespace-nowrap">
      {paths.map((path) => (
        <div key={`${path.Host}${path.Path}${path.ServiceName}:${path.Port}`}>
          <span className="flex flex-nowrap items-center gap-1 px-2">
            {link(
              path.Host,
              path.Path,
              isHTTP(row.original.TLS || [], path.Host)
            )}
            <Icon icon={ArrowRight} />
            {`${path.ServiceName}:${path.Port}`}
            {!path.HasService && (
              <Badge type="warn" className="ml-1 gap-1">
                <Icon icon={AlertTriangle} />
                Service doesn&apos;t exist
              </Badge>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function isHTTP(TLSs: TLS[], host: string) {
  return TLSs.filter((t) => t.Hosts.indexOf(host) !== -1).length === 0;
}

function link(host: string, path: string, isHttp: boolean) {
  if (!host) {
    return path;
  }
  return (
    <a
      href={`${isHttp ? 'http' : 'https'}://${host}${path}`}
      target="_blank"
      rel="noreferrer"
    >
      {`${isHttp ? 'http' : 'https'}://${host}${path}`}
    </a>
  );
}
