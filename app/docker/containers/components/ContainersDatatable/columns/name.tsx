import { CellProps, Column, TableInstance } from 'react-table';
import _ from 'lodash';
import { useSref } from '@uirouter/react';

import { useEnvironment } from '@/portainer/environments/useEnvironment';
import { useTableSettings } from '@/portainer/components/datatables/components/useTableSettings';
import type {
  ContainersTableSettings,
  DockerContainer,
} from '@/docker/containers/types';

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
  const { settings } = useTableSettings<ContainersTableSettings>();
  const truncate = settings.truncateContainerName;
  const endpoint = useEnvironment();
  const offlineMode = endpoint.Status !== 1;

  const linkProps = useSref('docker.containers.container', {
    id: container.Id,
    nodeName: container.NodeName,
  });

  let shortName = name;
  if (truncate > 0) {
    shortName = _.truncate(name, { length: truncate });
  }

  if (offlineMode) {
    return <span>{shortName}</span>;
  }

  return (
    <a href={linkProps.href} onClick={linkProps.onClick} title={name}>
      {shortName}
    </a>
  );
}
