import { useQuery } from '@tanstack/react-query';

import { gitOpsWorkflowsList } from '@api/sdk.gen';
import { GitOpsWorkflowsListData } from '@api/types.gen';

import { withError } from '@/react-tools/react-query';
import {
  withPaginationHeaders,
  PaginatedResults,
} from '@/react/common/api/pagination.types';

import { Workflow } from '../types';
import { workflowQueryKeys } from '../../queries/query-keys';

import { toWorkflow } from './mappers';

export type WorkflowsParams = GitOpsWorkflowsListData['query'];

async function getWorkflows(
  params?: WorkflowsParams
): Promise<PaginatedResults<Workflow[]>> {
  const { data, headers } = await gitOpsWorkflowsList({
    query: params,
  });

  return withPaginationHeaders({
    data: (data ?? []).map(toWorkflow),
    headers,
  });
}

export function useWorkflows(params?: WorkflowsParams) {
  return useQuery({
    queryKey: workflowQueryKeys.list(params),
    queryFn: () => getWorkflows(params),
    ...withError('Failed loading workflows'),
  });
}
