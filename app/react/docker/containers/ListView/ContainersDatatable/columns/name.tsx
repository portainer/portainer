import { CellProps, Column, TableInstance } from 'react-table';
import _ from 'lodash';
import { useSref } from '@uirouter/react';

import type { DockerContainer } from '@/react/docker/containers/types';
import { isOfflineEndpoint } from '@/portainer/helpers/endpointHelper';
import { useCurrentEnvironment } from '@/portainer/hooks/useCurrentEnvironment';

import { useTableSettings } from '@@/datatables/useZustandTableSettings';

import { TableSettings } from '../types';

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
}: CellProps<TableInstance>) {
  const linkProps = useSref('.container', {
    id: container.Id,
    nodeName: container.NodeName,
  });

  const { settings } = useTableSettings<TableSettings>();
  const truncate = settings.truncateContainerName;
  const environmentQuery = useCurrentEnvironment();

  const environment = environmentQuery.data;

  let shortName = name;
  if (truncate > 0) {
    shortName = _.truncate(name, { length: truncate });
  }

  if (!environment || isOfflineEndpoint(environment)) {
    return <span>{shortName}</span>;
  }

  return (
    <a href={linkProps.href} onClick={linkProps.onClick} title={name}>
      {shortName}
    </a>
  );
}
