import { CellContext } from '@tanstack/react-table';
import clsx from 'clsx';

import {
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationTypes,
} from '@/kubernetes/models/application/models/appConstants';

import styles from './columns.status.module.css';
import { helper } from './columns.helper';
import { ApplicationRowData } from './types';

export const status = helper.accessor('Status', {
  header: 'Status',
  cell: Cell,
  enableSorting: false,
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
