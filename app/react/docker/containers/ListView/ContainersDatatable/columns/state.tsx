import clsx from 'clsx';
import { CellContext } from '@tanstack/react-table';

import {
  type ContainerListViewModel,
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
  row: { original: container },
}: CellContext<ContainerListViewModel, ContainerStatus>) {
  const status = getValue();

  const hasHealthCheck = [
    ContainerStatus.Starting,
    ContainerStatus.Healthy,
    ContainerStatus.Unhealthy,
  ].includes(status);

  const statusClassName = getClassName();

  let transformedStatus: ContainerStatus | string = status;
  if (transformedStatus === ContainerStatus.Exited) {
    transformedStatus = `${transformedStatus} - code ${extractExitCode(
      container.StatusText
    )}`;
  }

  return (
    <span
      className={clsx('label', `label-${statusClassName}`, {
        interactive: hasHealthCheck,
      })}
      title={hasHealthCheck ? 'This container has a health check' : ''}
    >
      {transformedStatus}
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

  function extractExitCode(statusText: string) {
    const regex = /\((\d+)\)/;
    const match = statusText.match(regex);
    return match ? match[1] : '';
  }
}
