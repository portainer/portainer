import { CellProps, Column } from 'react-table';

import { Icon } from '@@/Icon';

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
          {link(path.Host, path.Path, isHttp)}
          <span className="px-2">
            <Icon icon="arrow-right" feather />
          </span>
          {`${path.ServiceName}:${path.Port}`}
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
