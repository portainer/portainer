import clsx from 'clsx';
import { ReactNode } from 'react';

import { Link } from '@@/Link';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { EdgeStack, StatusType } from '../../types';

export function DeploymentCounterLink({
  count,
  total,
  type,
  stackId,
}: {
  count: number;
  total: number;
  type: StatusType;
  stackId: EdgeStack['Id'];
}) {
  return (
    <div className="w-full text-center">
      <Link
        className="hover:no-underline"
        to="edge.stacks.edit"
        params={{ stackId, tab: 'environments', status: type }}
        data-cy="deployment-counter-link"
      >
        <DeploymentCounter count={count} type={type} total={total} />
      </Link>
    </div>
  );
}

export function DeploymentCounter({
  count,
  total,
  type,
}: {
  count: number;
  total: number;
  type: StatusType;
}) {
  return (
    <TooltipWithChildren message={getTooltip(count, total, type)}>
      <div className="h-2 w-full overflow-hidden rounded-lg">
        <progress
          aria-label={`${getLabel(type)}`}
          className={clsx('bg-gray-4 w-full', {
            'progress-filled:bg-success-7': type === StatusType.Running,
            'progress-filled:bg-error-7': type === StatusType.Error,
            'progress-filled:bg-blue-9': type === StatusType.Acknowledged,
            'progress-filled:bg-yellow-7': type === StatusType.ImagesPulled,
          })}
          max={total}
          value={total ? count : 0}
        />
      </div>
    </TooltipWithChildren>
  );
}

function getTooltip(count: number, total: number, type: StatusType) {
  const label = getLabel(type);
  return `${count} of ${total} ${label}`;
}

function getLabel(type: StatusType): ReactNode {
  switch (type) {
    case StatusType.Running:
      return 'deployments running';
    case StatusType.Completed:
      return 'deployments completed';
    case StatusType.DeploymentReceived:
      return 'deployments received';
    case StatusType.Error:
      return 'deployments failed';
    case StatusType.Acknowledged:
      return 'deployments acknowledged';
    case StatusType.ImagesPulled:
      return 'images pre-pulled';
    default:
      return '';
  }
}
