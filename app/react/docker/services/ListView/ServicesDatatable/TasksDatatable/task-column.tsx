import { CellContext } from '@tanstack/react-table';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { DecoratedTask } from '@/react/docker/services/ItemView/TasksDatatable/types';
import { columnHelper } from '@/react/docker/services/ItemView/TasksDatatable/columns/helper';

import { Link } from '@@/Link';

export const task = columnHelper.accessor('Id', {
  header: 'Task',
  cell: Cell,
});

function Cell({
  getValue,
  row: { original: item },
}: CellContext<DecoratedTask, string>) {
  const environmentQuery = useCurrentEnvironment();

  if (!environmentQuery.data) {
    return null;
  }

  const value = getValue();
  const isAgent = isAgentEnvironment(environmentQuery.data.Type);

  return isAgent && item.Container ? (
    <Link
      to="docker.containers.container"
      params={{ id: item.Container.Id, nodeName: item.Container.NodeName }}
      className="monospaced"
      data-cy="docker-task-container-link"
    >
      {value}
    </Link>
  ) : (
    <Link
      to="docker.tasks.task"
      params={{ id: item.Id }}
      className="monospaced"
      data-cy="docker-task-link"
    >
      {value}
    </Link>
  );
}
