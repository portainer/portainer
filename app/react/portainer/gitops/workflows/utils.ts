import { StackType } from '@/react/common/stacks/types';

import { DeploymentPlatform, WorkflowType } from './types';

export function getWorkflowLink(item: { id: number }): {
  to: string;
  params: object;
} {
  return {
    to: 'portainer.gitops.workflows.item',
    params: { workflowId: item.id },
  };
}

export function getSourceLink(sourceId: number): {
  to: string;
  params: object;
} {
  return {
    to: 'portainer.gitops.sources.item',
    params: { sourceId },
  };
}

interface DeployedStack {
  id: number;
  name: string;
  type: WorkflowType;
  platform?: DeploymentPlatform;
  target?: { endpointId?: number };
}

/** Links to the actual deployed Stack/EdgeStack a Workflow or WorkflowArtifact represents. */
export function getDeployedStackLink(
  item: DeployedStack
): { to: string; params: object } | null {
  if (item.type === 'edgeStack') {
    return { to: 'edge.stacks.edit', params: { stackId: item.id } };
  }

  if (item.platform === 'kubernetes') {
    return null;
  }

  const type =
    item.platform === 'dockerSwarm'
      ? StackType.DockerSwarm
      : StackType.DockerCompose;

  return {
    to: 'docker.stacks.stack',
    params: {
      endpointId: item.target?.endpointId,
      name: item.name,
      id: item.id,
      type,
      regular: true,
    },
  };
}
