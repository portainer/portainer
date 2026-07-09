import { GitCommit, PenBoxIcon, PauseIcon, RefreshCwIcon } from 'lucide-react';
import _ from 'lodash';

import { Icon } from '@@/Icon';
import { ResourceDetailHeader } from '@@/ResourceDetailHeader/ResourceDetailHeader';
import { HeaderStats } from '@@/ResourceDetailHeader/HeaderStats';
import { ResourceStatBlock } from '@@/ResourceDetailHeader/ResourceStatBlock';
import { ActionBarShell } from '@@/ResourceDetailHeader/ActionBarShell';
import { Button } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { WorkflowDetail } from '../types';
import { StatusBadge } from '../../components/StatusBadge';
import { computeTargetRollup, effectiveWorkflowDetailStatus } from '../status';

const COMING_SOON_MESSAGE = 'Coming soon';

interface Props {
  workflow: WorkflowDetail;
}

export function WorkflowResourceHeader({ workflow }: Props) {
  const status = effectiveWorkflowDetailStatus(workflow);
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
      actionBar={
        <ActionBarShell>
          <div className="flex items-center gap-2">
            <TooltipWithChildren message={COMING_SOON_MESSAGE}>
              <span>
                <Button
                  icon={PenBoxIcon}
                  color="light"
                  disabled
                  data-cy="workflow-edit-button"
                >
                  Edit
                </Button>
              </span>
            </TooltipWithChildren>
            <TooltipWithChildren message={COMING_SOON_MESSAGE}>
              <span>
                <Button
                  icon={RefreshCwIcon}
                  color="light"
                  disabled
                  data-cy="workflow-sync-button"
                >
                  Force sync
                </Button>
              </span>
            </TooltipWithChildren>
            <TooltipWithChildren message={COMING_SOON_MESSAGE}>
              <span>
                <Button
                  icon={PauseIcon}
                  color="light"
                  disabled
                  data-cy="workflow-pause-button"
                >
                  Pause
                </Button>
              </span>
            </TooltipWithChildren>
          </div>
          <div className="ml-auto">
            <TooltipWithChildren message={COMING_SOON_MESSAGE}>
              <span>
                <DeleteButton
                  confirmMessage="Are you sure you want to delete this workflow?"
                  onConfirmed={_.noop}
                  data-cy="workflow-delete-button"
                  disabled
                />
              </span>
            </TooltipWithChildren>
          </div>
        </ActionBarShell>
      }
    />
  );
}
