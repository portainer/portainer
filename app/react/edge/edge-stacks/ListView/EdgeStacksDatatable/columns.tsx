import { createColumnHelper } from '@tanstack/react-table';
import _ from 'lodash';

import i18n from '@/i18n';
import { isoDateFromTimestamp } from '@/portainer/filters/filters';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { GitCommitLink } from '@/react/portainer/gitops/GitCommitLink';

import { buildNameColumnFromObject } from '@@/datatables/buildNameColumn';
import { Link } from '@@/Link';
import { Tooltip } from '@@/Tip/Tooltip';

import { StatusType } from '../../types';

import { EdgeStackStatus } from './EdgeStacksStatus';
import { DecoratedEdgeStack } from './types';
import { DeploymentCounter } from './DeploymentCounter';

const columnHelper = createColumnHelper<DecoratedEdgeStack>();

export const columns = _.compact([
  buildNameColumnFromObject<DecoratedEdgeStack>({
    nameKey: 'Name',
    path: 'edge.stacks.edit',
    dataCy: 'edge-stacks-name',
    idParam: 'stackId',
  }),
  columnHelper.accessor(
    (item) =>
      item.StatusSummary?.AggregatedStatus?.[StatusType.Acknowledged] || 0,
    {
      id: 'acknowledged',
      header: () => i18n.t('edge.stacks.columns.acknowledged'),
      enableSorting: false,
      enableHiding: false,
      cell: ({ getValue, row }) => (
        <DeploymentCounter
          count={getValue()}
          type={StatusType.Acknowledged}
          total={row.original.NumDeployments}
        />
      ),
      meta: {
        className: '[&>*]:justify-center',
      },
    }
  ),
  isBE &&
    columnHelper.accessor(
      (item) =>
        item.StatusSummary?.AggregatedStatus?.[StatusType.ImagesPulled] || 0,
      {
        id: 'imagesPulled',
        header: () => i18n.t('edge.stacks.columns.images_pre_pulled'),
        cell: ({ getValue, row: { original: item } }) => {
          if (!item.PrePullImage) {
            return <div className="text-center">-</div>;
          }

          return (
            <DeploymentCounter
              count={getValue()}
              type={StatusType.ImagesPulled}
              total={item.NumDeployments}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        meta: {
          className: '[&>*]:justify-center',
        },
      }
    ),
  columnHelper.accessor(
    (item) =>
      item.StatusSummary?.AggregatedStatus?.[StatusType.DeploymentReceived] ||
      0,
    {
      id: 'deploymentsReceived',
      header: () => i18n.t('edge.stacks.columns.deployments_received'),
      cell: ({ getValue, row }) => (
        <DeploymentCounter
          count={getValue()}
          type={StatusType.Running}
          total={row.original.NumDeployments}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: '[&>*]:justify-center',
      },
    }
  ),
  columnHelper.accessor(
    (item) => item.StatusSummary?.AggregatedStatus?.[StatusType.Error] || 0,
    {
      id: 'deploymentsFailed',
      header: () => i18n.t('edge.stacks.columns.deployments_failed'),
      cell: ({ getValue, row }) => {
        const count = getValue();

        return (
          <div className="flex items-center gap-2">
            <DeploymentCounter
              count={count}
              type={StatusType.Error}
              total={row.original.NumDeployments}
            />
            {count > 0 && (
              <Link
                className="hover:no-underline"
                to="edge.stacks.edit"
                params={{
                  stackId: row.original.Id,
                  tab: 'environments',
                  status: StatusType.Error,
                }}
                data-cy={`edge-stacks-error-${row.original.Id}`}
              >
                ({count}/{row.original.NumDeployments})
              </Link>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: '[&>*]:justify-center',
      },
    }
  ),
  columnHelper.accessor('Status', {
    header: StatusHeader,
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
  columnHelper.accessor('CreationDate', {
    id: 'creationDate',
    header: () => i18n.t('edge.stacks.columns.creation_date'),
    cell: ({ getValue }) => isoDateFromTimestamp(getValue()),
    enableHiding: false,
  }),
  isBE &&
    columnHelper.accessor(
      (item) =>
        item.GitConfig ? item.GitConfig.ConfigHash : item.StackFileVersion,
      {
        id: 'targetVersion',
        header: () => i18n.t('edge.stacks.columns.target_version'),
        enableSorting: false,
        cell: ({ row: { original: item } }) => {
          if (item.GitConfig) {
            return (
              <div className="text-center">
                <GitCommitLink
                  baseURL={item.GitConfig.URL}
                  commitHash={item.GitConfig.ConfigHash}
                />
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

function StatusHeader() {
  return (
    <>
      {i18n.t('edge.stacks_col_status')}
      <Tooltip
        position="top"
        message={
          <>
            <div>
              {i18n.t('edge.stacks_status_tooltip1')}
            </div>
            <div>
              {i18n.t('edge.stacks_status_tooltip2')}
            </div>
          </>
        }
      />
    </>
  );
}
