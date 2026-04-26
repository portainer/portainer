import clsx from 'clsx';
import { ReactNode } from 'react';

import { WorkflowStatus } from '../types';

const STATUS_DOT_CLASSES: Record<WorkflowStatus, string> = {
  healthy: 'bg-success-7 th-highcontrast:bg-success-3',
  error: 'bg-error-7 th-highcontrast:bg-error-3',
  syncing: 'bg-warning-7 th-highcontrast:bg-warning-3',
  paused: 'bg-warning-5 th-highcontrast:bg-yellow-3',
  unknown: 'bg-gray-4 th-highcontrast:bg-gray-3',
};

const STATUS_BLOCK_CLASSES: Record<WorkflowStatus, string> = {
  healthy: 'bg-success-1 th-dark:bg-success-11 th-highcontrast:bg-success-11',
  error: 'bg-error-1 th-dark:bg-error-11 th-highcontrast:bg-error-11',
  syncing: 'bg-warning-1 th-dark:bg-warning-11 th-highcontrast:bg-warning-11',
  paused: 'bg-gray-2 th-dark:bg-gray-iron-11 th-highcontrast:bg-gray-iron-11',
  unknown: 'bg-gray-2 th-dark:bg-gray-iron-11 th-highcontrast:bg-gray-iron-11',
};

export function Block({
  status,
  className,
  children,
}: {
  status: WorkflowStatus;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        'rounded px-3 py-2',
        STATUS_BLOCK_CLASSES[status],
        className
      )}
    >
      {children}
    </div>
  );
}

export function Dot({
  status,
  className,
}: {
  status: WorkflowStatus;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'h-2 w-2 shrink-0 rounded-full',
        STATUS_DOT_CLASSES[status],
        className
      )}
    />
  );
}
