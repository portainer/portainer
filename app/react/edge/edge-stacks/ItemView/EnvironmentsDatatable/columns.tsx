import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import _ from 'lodash';

import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';

import { EdgeStackStatus, StatusType } from '../../types';

import { EnvironmentActions } from './EnvironmentActions';
import { ActionStatus } from './ActionStatus';
import { EdgeStackEnvironment } from './types';

const columnHelper = createColumnHelper<EdgeStackEnvironment>();

export const columns = [
  columnHelper.accessor('Name', {
    id: 'name',
    header: 'Name',
  }),
  columnHelper.accessor(
    (env) => env.StackStatus.map((s) => StatusType[s.Type]).join(','),
    {
      id: 'status',
      header: 'Status',
      cell({ row: { original: env } }) {
        return endpointStatusLabel(env.StackStatus);
      },
    }
  ),
  columnHelper.accessor(
    (env) => env.StackStatus.find((s) => s.Type === StatusType.Error)?.Error,
    {
      id: 'error',
      header: 'Error',
      cell: ErrorCell,
    }
  ),
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

function endpointStatusLabel(statusArray: Array<EdgeStackStatus>) {
  const labels = [];

  statusArray.forEach((status) => {
    if (status.Type === StatusType.Acknowledged) {
      labels.push('Acknowledged');
    }
    if (status.Type === StatusType.ImagesPulled) {
      labels.push('Images pre-pulled');
    }
    if (status.Type === StatusType.Running) {
      labels.push('Deployed');
    }
    if (status.Type === StatusType.Error) {
      labels.push('Failed');
    }
  });

  if (!labels.length) {
    labels.push('Pending');
  }

  return _.uniq(labels).join(', ');
}
