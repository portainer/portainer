import { CellProps, Column } from 'react-table';

import { Icon } from '@@/Icon';
import { Badge } from '@@/Badge';

import { Ingress, TLS, Path } from '../../types';

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

export const ingressRules: Column<Ingress> = {
  Header: 'Rules and Paths',
  accessor: 'Paths',
  Cell: ({ row }: CellProps<Ingress, Path[]>) => {
    const results = row.original.Paths?.map((path: Path) => {
      const isHttp = isHTTP(row.original.TLS || [], path.Host);
      return (
        <div key={`${path.Host}${path.Path}${path.ServiceName}:${path.Port}`}>
          <span className="flex px-2 flex-nowrap items-center gap-1">
            {link(path.Host, path.Path, isHttp)}
            <Icon icon="arrow-right" feather />
            {`${path.ServiceName}:${path.Port}`}
            {!path.HasService && (
              <Badge type="warn" className="ml-1 gap-1">
                <Icon icon="alert-triangle" feather />
                Service doesn&apos;t exist
              </Badge>
            )}
          </span>
        </div>
      );
    });
    return results || <div />;
  },
  id: 'ingressRules',
  disableFilters: true,
  canHide: true,
  disableSortBy: true,
};
