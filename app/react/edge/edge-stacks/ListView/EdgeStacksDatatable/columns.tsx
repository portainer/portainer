import { createColumnHelper } from '@tanstack/react-table';
import clsx from 'clsx';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { buildNameColumn } from '@@/datatables/NameCell';
import { Link } from '@@/Link';

import { EdgeStack, StatusType } from '../../types';

import { DecoratedEdgeStack } from './types';

const columnHelper = createColumnHelper<DecoratedEdgeStack>();

export const columns = [
  buildNameColumn<DecoratedEdgeStack>('Name', 'Id', 'edge.stacks.edit'),
  columnHelper.accessor('aggregatedStatus.acknowledged', {
    header: 'Acknowledged',
    enableSorting: false,
    enableHiding: false,
    cell: ({ getValue, row }) => (
      <Status
        count={getValue()}
        type="Acknowledged"
        stackId={row.original.Id}
      />
    ),
    meta: {
      className: '[&>*]:justify-center',
    },
  }),
  columnHelper.accessor('aggregatedStatus.imagesPulled', {
    header: 'Images Pre-pulled',
    cell: ({ getValue, row }) => (
      <Status
        count={getValue()}
        type="ImagesPulled"
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
      <Status count={getValue()} type="Ok" stackId={row.original.Id} />
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
      <Status count={getValue()} type="Error" stackId={row.original.Id} />
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
        <span className="edge-stack-status status-total">{getValue()}</span>
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
];

function Status({
  count,
  type,
  stackId,
}: {
  count: number;
  type: StatusType;
  stackId: EdgeStack['Id'];
}) {
  return (
    <div className="text-center">
      <Link
        className="hover:no-underline"
        to="edge.stacks.edit"
        params={{ stackId, tab: 1, status: type }}
      >
        <span
          className={clsx('edge-stack-status ', {
            'status-ok': type === 'Ok',
            'status-error': type === 'Error',
            'status-acknowledged': type === 'Acknowledged',
            'status-images-pulled': type === 'ImagesPulled',
          })}
        >
          &bull; {count}
        </span>
      </Link>
    </div>
  );
}
