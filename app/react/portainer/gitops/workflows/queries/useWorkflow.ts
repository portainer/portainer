import { useQuery } from '@tanstack/react-query';

import { gitOpsWorkflowGet } from '@api/sdk.gen';

import { withError } from '@/react-tools/react-query';

import { Workflow } from '../types';
import { workflowQueryKeys } from '../../queries/query-keys';

import { toWorkflow } from './mappers';

async function getWorkflow(id: number): Promise<Workflow> {
  const response = await gitOpsWorkflowGet({ path: { id } });

  return toWorkflow(response.data);
}

export function useWorkflow(id: number | undefined) {
  return useQuery({
    queryKey: workflowQueryKeys.detail(id!),
    queryFn: () => getWorkflow(id!),
    enabled: !!id,
    ...withError('Failed loading workflow'),
  });
}
