import { CellContext, Row } from '@tanstack/react-table';
import clsx from 'clsx';

import {
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationTypes,
} from '@/kubernetes/models/application/models/appConstants';

import { filterHOC } from '@@/datatables/Filter';

import styles from './columns.status.module.css';
import { helper } from './columns.helper';
import { ApplicationRowData } from './types';

export const status = helper.accessor(getStatusSummary, {
  header: 'Status',
  cell: Cell,
  meta: {
    filter: filterHOC('Filter by status'),
  },
  enableColumnFilter: true,
  filterFn: (row: Row<ApplicationRowData>, _: string, filterValue: string[]) =>
    filterValue.length === 0 ||
    filterValue.includes(getStatusSummary(row.original)),
});

function Cell({
  row: { original: item },
}: CellContext<ApplicationRowData, string>) {
  if (
    item.ApplicationType === KubernetesApplicationTypes.Pod &&
    item.Pods &&
    item.Pods.length > 0
  ) {
    return item.Pods[0].Status;
  }

  return (
    <>
      <span
        className={clsx([
          styles.statusIndicator,
          {
            [styles.ok]:
              (item.TotalPodsCount > 0 &&
                item.TotalPodsCount === item.RunningPodsCount) ||
              item.Status === 'Ready',
          },
        ])}
      />
      {item.ApplicationType !== KubernetesApplicationTypes.Helm && (
        <>
          {item.DeploymentType ===
            KubernetesApplicationDeploymentTypes.Replicated && (
            <span className="mr-1">Replicated</span>
          )}
          {item.DeploymentType ===
            KubernetesApplicationDeploymentTypes.Global && (
            <span className="mr-1">Global</span>
          )}
          {item.RunningPodsCount >= 0 && item.TotalPodsCount >= 0 && (
            <span>
              <code aria-label="Running Pods" title="Running Pods">
                {item.RunningPodsCount}
              </code>{' '}
              /{' '}
              <code aria-label="Total Pods" title="Total Pods">
                {item.TotalPodsCount}
              </code>
            </span>
          )}
        </>
      )}
      {item.KubernetesApplications && <span>{item.Status}</span>}
    </>
  );
}

function getStatusSummary(item: ApplicationRowData): 'Ready' | 'Not Ready' {
  if (
    item.ApplicationType === KubernetesApplicationTypes.Pod &&
    item.Pods &&
    item.Pods.length > 0
  ) {
    return item.Pods[0].Status === 'Running' ? 'Ready' : 'Not Ready';
  }
  return item.TotalPodsCount > 0 &&
    item.TotalPodsCount === item.RunningPodsCount
    ? 'Ready'
    : 'Not Ready';
}
