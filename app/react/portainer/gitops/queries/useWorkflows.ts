import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { withGlobalError } from '@/react-tools/react-query';
import { withPaginationHeaders } from '@/react/common/api/pagination.types';

import {
  DeploymentPlatform,
  Workflow,
  WorkflowStatus,
  WorkflowType,
} from '../WorkflowsView/types';

import { workflowQueryKeys } from './query-keys';

export interface WorkflowsParams {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  start?: number;
  limit?: number;
  status?: WorkflowStatus | null;
  type?: WorkflowType | null;
  platform?: DeploymentPlatform | null;
}

async function getWorkflows(params: WorkflowsParams) {
  const response = await axios.get<Workflow[]>('/gitops/workflows', {
    params,
  });
  return withPaginationHeaders(response);
}

export function useWorkflows(params: WorkflowsParams) {
  return useQuery({
    queryKey: workflowQueryKeys.list(params),
    queryFn: () => getWorkflows(params),
    ...withGlobalError('Failed loading workflows'),
  });
}
