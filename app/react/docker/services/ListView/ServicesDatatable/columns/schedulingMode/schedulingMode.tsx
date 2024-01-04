import { CellContext } from '@tanstack/react-table';
import { Node } from 'docker-types/generated/1.41';

import { ServiceViewModel } from '@/docker/models/service';
import { useNodes } from '@/react/docker/proxy/queries/nodes/useNodes';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { TaskViewModel } from '@/docker/models/task';

import { columnHelper } from '../helper';

import { matchesServiceConstraints } from './constraint-helper';
import { ScaleServiceButton } from './ScaleServiceButton';

export const schedulingMode = columnHelper.accessor('Mode', {
  header: 'Scheduling Mode',
  cell: Cell,
  enableHiding: false,
});

function Cell({
  getValue,
  row: { original: item },
}: CellContext<ServiceViewModel, string>) {
  const environmentId = useEnvironmentId();
  const nodesQuery = useNodes(environmentId);

  if (!nodesQuery.data) {
    return null;
  }

  const mode = getValue();
  return (
    <div className="flex items-center gap-3">
      {mode}
      <code>{totalRunningTasks(item.Tasks)}</code> /{' '}
      <code>
        {mode === 'replicated'
          ? item.Replicas
          : availableNodeCount(nodesQuery.data, item)}
      </code>
      {mode === 'replicated' && <ScaleServiceButton service={item} />}
    </div>
  );
}

function totalRunningTasks(tasks: Array<TaskViewModel>) {
  return tasks.filter(
    (task) =>
      task.Status?.State === 'running' && task.DesiredState === 'running'
  ).length;
}

function availableNodeCount(nodes: Array<Node>, service: ServiceViewModel) {
  let availableNodes = 0;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (
      node.Spec?.Availability === 'active' &&
      node.Status?.State === 'ready' &&
      matchesServiceConstraints(service, node)
    ) {
      availableNodes++;
    }
  }
  return availableNodes;
}
