import { Node } from 'docker-types/generated/1.41';
import { CellContext } from '@tanstack/react-table';

import { useNodes } from '@/react/docker/proxy/queries/nodes/useNodes';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { DecoratedTask } from '../types';

import { columnHelper } from './helper';

export const node = columnHelper.accessor('NodeId', {
  header: 'Node',
  cell: Cell,
});

function Cell({ getValue }: CellContext<DecoratedTask, string>) {
  const environmentId = useEnvironmentId();

  const nodesQuery = useNodes(environmentId);

  const nodes = nodesQuery.data || [];
  return getNodeName(getValue(), nodes);
}

function getNodeName(nodeId: string, nodes: Array<Node>) {
  const node = nodes.find((node) => node.ID === nodeId);
  if (node?.Description?.Hostname) {
    return node.Description.Hostname;
  }

  return '';
}
