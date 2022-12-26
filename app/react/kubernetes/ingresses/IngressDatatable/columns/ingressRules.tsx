import { CellContext } from '@tanstack/react-table';
import { AlertTriangle, ArrowRight } from 'lucide-react';

import { Icon } from '@@/Icon';
import { Badge } from '@@/Badge';

import { Ingress, TLS, Path } from '../../types';

import { columnHelper } from './helper';

export const ingressRules = columnHelper.accessor('Paths', {
  header: 'Rules and Paths',
  id: 'ingressRules',
  cell: Cell,
});

function Cell({ row, getValue }: CellContext<Ingress, Path[] | undefined>) {
  const paths = getValue();

  if (!paths) {
    return <div />;
  }

  return paths.map((path) => {
    const isHttp = isHTTP(row.original.TLS || [], path.Host);
    return (
      <div key={`${path.Host}${path.Path}${path.ServiceName}:${path.Port}`}>
        <span className="flex flex-nowrap items-center gap-1 px-2">
          {link(path.Host, path.Path, isHttp)}
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
    );
  });
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
