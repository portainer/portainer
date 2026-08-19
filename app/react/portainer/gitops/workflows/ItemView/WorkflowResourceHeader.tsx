import { GitCommit } from 'lucide-react';

import { Icon } from '@@/Icon';
import { ResourceDetailHeader } from '@@/ResourceDetailHeader/ResourceDetailHeader';
import { HeaderStats } from '@@/ResourceDetailHeader/HeaderStats';
import { ResourceStatBlock } from '@@/ResourceDetailHeader/ResourceStatBlock';

import { Workflow } from '../types';
import { StatusBadge } from '../../components/StatusBadge';
import { effectiveWorkflowStatus, computeTargetRollup } from '../status';

interface Props {
  workflow: Workflow;
}

export function WorkflowResourceHeader({ workflow }: Props) {
  const status = effectiveWorkflowStatus(workflow);
  const rollup = computeTargetRollup(workflow);

  return (
    <ResourceDetailHeader
      icon={<Icon icon={GitCommit} size="xl" />}
      title={workflow.name}
      badge={<StatusBadge status={status.status} />}
      rightInfo={
        <HeaderStats>
          <ResourceStatBlock
            status={rollup.tone}
            data-cy="workflow-targets-stat"
          >
            <ResourceStatBlock.Label>Targets</ResourceStatBlock.Label>
            <ResourceStatBlock.Value align="center" size="base" dot>
              {rollup.total > 0
                ? `${rollup.synced}/${rollup.total} synced`
                : 'No artifacts'}
            </ResourceStatBlock.Value>
          </ResourceStatBlock>
        </HeaderStats>
      }
    />
  );
}
