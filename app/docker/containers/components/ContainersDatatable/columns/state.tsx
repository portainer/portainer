import { Column } from 'react-table';
import clsx from 'clsx';
import _ from 'lodash';

import type {
  DockerContainer,
  DockerContainerStatus,
} from '@/docker/containers/types';

import { DefaultFilter } from '@@/datatables/Filter';

export const state: Column<DockerContainer> = {
  Header: 'State',
  accessor: 'Status',
  id: 'state',
  Cell: StatusCell,
  sortType: 'string',
  filter: 'multiple',
  Filter: DefaultFilter,
  canHide: true,
};

function StatusCell({ value: status }: { value: DockerContainerStatus }) {
  const statusNormalized = _.toLower(status);
  const hasHealthCheck = ['starting', 'healthy', 'unhealthy'].includes(
    statusNormalized
  );

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
    if (includeString(['paused', 'starting', 'unhealthy'])) {
      return 'warning';
    }

    if (includeString(['created'])) {
      return 'info';
    }

    if (includeString(['stopped', 'dead', 'exited'])) {
      return 'danger';
    }

    return 'success';

    function includeString(values: DockerContainerStatus[]) {
      return values.some((val) => statusNormalized.includes(val));
    }
  }
}
