import { useSourceWorkflows } from '../queries/useSourceWorkflows';
import { Source } from '../types';

import { CountDot } from './CountDot';

export function WorkflowsCountDot({ sourceId }: { sourceId: Source['id'] }) {
  const workflowsQuery = useSourceWorkflows(sourceId);

  return <CountDot value={workflowsQuery.data?.length} type="workflow" />;
}
