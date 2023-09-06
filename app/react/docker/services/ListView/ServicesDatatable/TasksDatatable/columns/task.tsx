import { CellContext } from '@tanstack/react-table';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';

import { Link } from '@@/Link';

import { DecoratedTask } from '../types';

import { columnHelper } from './helper';

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
    >
      {value}
    </Link>
  ) : (
    <Link
      to="docker.tasks.task"
      params={{ id: item.Id }}
      className="monospaced"
    >
      {value}
    </Link>
  );
}
