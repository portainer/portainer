import clsx from 'clsx';
import { CellContext } from '@tanstack/react-table';

import {
  type DockerContainer,
  ContainerStatus,
} from '@/react/docker/containers/types';

import { filterHOC } from '@@/datatables/Filter';
import { multiple } from '@@/datatables/filter-types';

import { columnHelper } from './helper';

export const state = columnHelper.accessor('Status', {
  header: 'State',
  id: 'state',
  cell: StatusCell,
  enableColumnFilter: true,
  filterFn: multiple,
  meta: {
    filter: filterHOC('Filter by state'),
  },
});

function StatusCell({
  getValue,
}: CellContext<DockerContainer, ContainerStatus>) {
  const status = getValue();

  const hasHealthCheck = [
    ContainerStatus.Starting,
    ContainerStatus.Healthy,
    ContainerStatus.Unhealthy,
  ].includes(status);

  const statusClassName = getClassName();

  return (
    <span
      className={clsx('label', `label-${statusClassName}`, {
        interactive: hasHealthCheck,
      })}
      title={hasHealthCheck ? 'This container has a health check' : ''}
    >
      {status}
    </span>
  );

  function getClassName() {
    switch (status) {
      case ContainerStatus.Paused:
      case ContainerStatus.Starting:
      case ContainerStatus.Unhealthy:
        return 'warning';
      case ContainerStatus.Created:
        return 'info';
      case ContainerStatus.Stopped:
      case ContainerStatus.Dead:
      case ContainerStatus.Exited:
        return 'danger';
      case ContainerStatus.Healthy:
      case ContainerStatus.Running:
      default:
        return 'success';
    }
  }
}
