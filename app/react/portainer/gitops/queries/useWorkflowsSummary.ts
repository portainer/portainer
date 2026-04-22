import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { withGlobalError } from '@/react-tools/react-query';

import { workflowQueryKeys } from './query-keys';

export interface WorkflowSummary {
  healthy: number;
  error: number;
  syncing: number;
  paused: number;
  unknown: number;
}

async function getWorkflowsSummary(): Promise<WorkflowSummary> {
  const { data } = await axios.get<WorkflowSummary>(
    '/gitops/workflows/summary'
  );
  return data;
}

export function useWorkflowsSummary() {
  return useQuery({
    queryKey: workflowQueryKeys.summary(),
    queryFn: getWorkflowsSummary,
    ...withGlobalError('Failed loading workflow summary'),
  });
}
