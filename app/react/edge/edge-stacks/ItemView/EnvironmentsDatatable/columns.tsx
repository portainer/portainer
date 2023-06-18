import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';

import { EdgeStackStatus } from '../../types';

import { EnvironmentActions } from './EnvironmentActions';
import { ActionStatus } from './ActionStatus';
import { EdgeStackEnvironment } from './types';

const columnHelper = createColumnHelper<EdgeStackEnvironment>();

export const columns = [
  columnHelper.accessor('Name', {
    id: 'name',
    header: 'Name',
  }),
  columnHelper.accessor((env) => endpointStatusLabel(env.StackStatus), {
    id: 'status',
    header: 'Status',
  }),
  columnHelper.accessor((env) => env.StackStatus.Error, {
    id: 'error',
    header: 'Error',
    cell: ErrorCell,
  }),
  ...(isBE
    ? [
        columnHelper.display({
          id: 'actions',
          header: 'Actions',
          cell({ row: { original: env } }) {
            return <EnvironmentActions environment={env} />;
          },
        }),
        columnHelper.display({
          id: 'actionStatus',
          header: 'Action Status',
          cell({ row: { original: env } }) {
            return <ActionStatus environmentId={env.Id} />;
          },
        }),
      ]
    : []),
];

function ErrorCell({ getValue }: CellContext<EdgeStackEnvironment, string>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const value = getValue();
  if (!value) {
    return '-';
  }

  return (
    <Button
      className="flex cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="pt-0.5 pr-1">
        <Icon icon={isExpanded ? ChevronDown : ChevronRight} />
      </div>
      <div
        className={clsx('overflow-hidden whitespace-normal', {
          'h-[1.5em]': isExpanded,
        })}
      >
        {value}
      </div>
    </Button>
  );
}

function endpointStatusLabel(status: EdgeStackStatus) {
  const details = (status && status.Details) || {};

  const labels = [];

  if (details.Acknowledged) {
    labels.push('Acknowledged');
  }

  if (details.ImagesPulled) {
    labels.push('Images pre-pulled');
  }

  if (details.Ok) {
    labels.push('Deployed');
  }

  if (details.Error) {
    labels.push('Failed');
  }

  if (!labels.length) {
    labels.push('Pending');
  }

  return labels.join(', ');
}
