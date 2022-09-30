import { CellProps, Column } from 'react-table';
import _ from 'lodash';
import { useSref } from '@uirouter/react';

import type { DockerContainer } from '@/react/docker/containers/types';
import { isOfflineEndpoint } from '@/portainer/helpers/endpointHelper';

import { useTableSettings } from '@@/datatables/useZustandTableSettings';

import { TableSettings } from '../types';
import { useRowContext } from '../RowContext';

export const name: Column<DockerContainer> = {
  Header: 'Name',
  accessor: (row) => {
    const name = row.Names[0];
    return name.substring(1, name.length);
  },
  id: 'name',
  Cell: NameCell,
  disableFilters: true,
  Filter: () => null,
  canHide: true,
  sortType: 'string',
};

export function NameCell({
  value: name,
  row: { original: container },
}: CellProps<DockerContainer>) {
  const linkProps = useSref('.container', {
    id: container.Id,
    nodeName: container.NodeName,
  });

  const { settings } = useTableSettings<TableSettings>();
  const truncate = settings.truncateContainerName;

  const { environment } = useRowContext();

  let shortName = name;
  if (truncate > 0) {
    shortName = _.truncate(name, { length: truncate });
  }

  if (isOfflineEndpoint(environment)) {
    return <span>{shortName}</span>;
  }

  return (
    <a href={linkProps.href} onClick={linkProps.onClick} title={name}>
      {shortName}
    </a>
  );
}
