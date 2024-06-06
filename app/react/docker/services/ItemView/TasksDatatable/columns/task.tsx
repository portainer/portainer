import { CellContext } from '@tanstack/react-table';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';

import { Link } from '@@/Link';

import { DecoratedTask } from '../types';
import { getTableMeta } from '../meta';

import { columnHelper } from './helper';

export const task = columnHelper.accessor('Id', {
  header: 'Id',
  cell: Cell,
});

function Cell({
  getValue,
  row: { original: item },
  table: {
    options: { meta },
  },
}: CellContext<DecoratedTask, string>) {
  const environmentQuery = useCurrentEnvironment();

  if (!environmentQuery.data) {
    return null;
  }

  const { serviceName } = getTableMeta(meta);

  const value = getValue();
  const isAgent = isAgentEnvironment(environmentQuery.data.Type);

  const name = `${serviceName}${item.Slot ? `.${item.Slot}` : ''}.${value}`;

  return isAgent && item.Container ? (
    <Link
      to="docker.containers.container"
      params={{ id: item.Container.Id, nodeName: item.Container.NodeName }}
      className="monospaced"
      data-cy="docker-container-task-link"
    >
      {name}
    </Link>
  ) : (
    <Link
      to="docker.tasks.task"
      params={{ id: value }}
      className="monospaced"
      data-cy="docker-task-link"
    >
      {name}
    </Link>
  );
}
