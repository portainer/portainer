import { StackType } from '@/react/common/stacks/types';

import { Workflow, WorkflowArtifact } from './types';

export function getWorkflowLink(item: Workflow): {
  to: string;
  params: object;
} {
  return {
    to: 'portainer.gitops.workflows.item',
    params: { workflowId: item.id },
  };
}

export function getArtifactStackLink(
  artifact: WorkflowArtifact
): { to: string; params: object } | null {
  if (artifact.type === 'edgeStack') {
    return { to: 'edge.stacks.edit', params: { stackId: artifact.id } };
  }

  if (artifact.platform === 'kubernetes') {
    return null;
  }

  const type =
    artifact.platform === 'dockerSwarm'
      ? StackType.DockerSwarm
      : StackType.DockerCompose;

  return {
    to: 'docker.stacks.stack',
    params: {
      endpointId: artifact.target?.endpointId,
      name: artifact.name,
      id: artifact.id,
      type,
      regular: true,
    },
  };
}
