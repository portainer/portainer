import { createColumnHelper } from '@tanstack/react-table';
import _ from 'lodash';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { buildNameColumn } from '@@/datatables/NameCell';

import { StatusType } from '../../types';
import { EdgeStackStatus } from '../EdgeStackStatus';

import { DecoratedEdgeStack } from './types';
import { DeploymentCounter, DeploymentCounterLink } from './DeploymentCounter';

const columnHelper = createColumnHelper<DecoratedEdgeStack>();

export const columns = _.compact([
  buildNameColumn<DecoratedEdgeStack>(
    'Name',
    'Id',
    'edge.stacks.edit',
    'stackId'
  ),
  columnHelper.accessor('aggregatedStatus.acknowledged', {
    header: 'Acknowledged',
    enableSorting: false,
    enableHiding: false,
    cell: ({ getValue, row }) => (
      <DeploymentCounterLink
        count={getValue()}
        type={StatusType.Acknowledged}
        stackId={row.original.Id}
      />
    ),
    meta: {
      className: '[&>*]:justify-center',
    },
  }),
  isBE &&
    columnHelper.accessor('aggregatedStatus.imagesPulled', {
      header: 'Images Pre-pulled',
      cell: ({ getValue, row }) => (
        <DeploymentCounterLink
          count={getValue()}
          type={StatusType.ImagesPulled}
          stackId={row.original.Id}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: '[&>*]:justify-center',
      },
    }),
  columnHelper.accessor('aggregatedStatus.ok', {
    header: 'Deployed',
    cell: ({ getValue, row }) => (
      <DeploymentCounterLink
        count={getValue()}
        type={StatusType.Running}
        stackId={row.original.Id}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: '[&>*]:justify-center',
    },
  }),
  columnHelper.accessor('aggregatedStatus.error', {
    header: 'Failed',
    cell: ({ getValue, row }) => (
      <DeploymentCounterLink
        count={getValue()}
        type={StatusType.Error}
        stackId={row.original.Id}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: '[&>*]:justify-center',
    },
  }),
  columnHelper.accessor('Status', {
    header: 'Status',
    cell: ({ row }) => (
      <div className="w-full text-center">
        <EdgeStackStatus edgeStack={row.original} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: '[&>*]:justify-center',
    },
  }),
  columnHelper.accessor('NumDeployments', {
    header: 'Deployments',
    cell: ({ getValue }) => (
      <div className="text-center">
        <DeploymentCounter count={getValue()} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: '[&>*]:justify-center',
    },
  }),
  columnHelper.accessor('CreationDate', {
    header: 'Creation Date',
    cell: ({ getValue }) => isoDateFromTimestamp(getValue()),
    enableHiding: false,
  }),
  isBE &&
    columnHelper.accessor(
      (item) =>
        item.GitConfig ? item.GitConfig.ConfigHash : item.StackFileVersion,
      {
        header: 'Target Version',
        enableSorting: false,
        cell: ({ row: { original: item } }) => {
          if (item.GitConfig) {
            return (
              <div className="text-center">
                <a
                  target="_blank"
                  href={`${item.GitConfig.URL}/commit/${item.GitConfig.ConfigHash}`}
                  rel="noreferrer"
                >
                  {item.GitConfig.ConfigHash.slice(0, 7)}
                </a>
              </div>
            );
          }

          return <div className="text-center">{item.StackFileVersion}</div>;
        },
        meta: {
          className: '[&>*]:justify-center',
        },
      }
    ),
]);
