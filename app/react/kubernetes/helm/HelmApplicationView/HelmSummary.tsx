import { Badge } from '@/react/components/Badge';
import { localizeDate } from '@/react/common/date-utils';

import { Alert } from '@@/Alert';
import { Card } from '@@/primitives/Card';

import { HelmRelease } from '../types';
import {
  DeploymentStatus,
  getStatusColor,
  getStatusText,
} from '../helm-status-utils';

interface Props {
  release: HelmRelease;
}

export function HelmSummary({ release }: Props) {
  const isSuccess =
    release.info?.status === DeploymentStatus.DEPLOYED ||
    release.info?.status === DeploymentStatus.SUPERSEDED;

  return (
    <div>
      <div className="mt-4 flex flex-col gap-y-4">
        <div>
          <Badge type={getStatusColor(release.info?.status)}>
            {getStatusText(release.info?.status)}
          </Badge>
        </div>
        {!!release.info?.description && !isSuccess && (
          <Alert color={getAlertColor(release.info?.status)}>
            {release.info?.description}
          </Alert>
        )}
        <Card.Container variant="filled">
          <Card.Body>
            <div className="form-section-title">Details</div>
            <div
              className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm lg:grid-cols-2 xl:grid-cols-3"
              data-cy="helm-release-info"
            >
              {!!release.namespace && (
                <div className="min-w-0">
                  <span className="text-muted">Namespace: </span>
                  <span data-cy="helm-info-namespace">{release.namespace}</span>
                </div>
              )}
              {!!release.version && (
                <div className="min-w-0">
                  <span className="text-muted">Revision: </span>
                  <span data-cy="helm-info-revision">#{release.version}</span>
                </div>
              )}
              {!!release.chart?.metadata?.name && (
                <div className="min-w-0">
                  <span className="text-muted">Chart: </span>
                  <span data-cy="helm-info-chart">
                    {release.chart.metadata.name}
                  </span>
                </div>
              )}
              <ChartReferenceBadge chartReference={release.chartReference} />
              {!!release.chart?.metadata?.appVersion && (
                <div className="min-w-0">
                  <span className="text-muted">App version: </span>
                  <span data-cy="helm-info-app-version">
                    {release.chart.metadata.appVersion}
                  </span>
                </div>
              )}
              {!!release.chart?.metadata?.version && (
                <div className="min-w-0">
                  <span className="text-muted">Chart version: </span>
                  <span className="inline-flex flex-wrap items-center gap-1">
                    <span data-cy="helm-info-chart-version">
                      {release.chart.metadata.name}-
                      {release.chart.metadata.version}
                    </span>
                  </span>
                </div>
              )}
              {!!release.info?.last_deployed && (
                <div className="min-w-0">
                  <span className="text-muted">Last deployed: </span>
                  <span data-cy="helm-info-last-deployed">
                    {localizeDate(new Date(release.info.last_deployed))}
                  </span>
                </div>
              )}
            </div>
          </Card.Body>
        </Card.Container>
      </div>
    </div>
  );
}

function ChartReferenceBadge({
  chartReference,
}: {
  chartReference: HelmRelease['chartReference'];
}) {
  // CE only supports Helm repositories (not OCI registries)
  if (!chartReference?.repoURL) {
    return null;
  }

  return (
    <div className="min-w-0">
      <span className="text-muted">Chart source: </span>
      <span>{chartReference.repoURL}</span>
    </div>
  );
}

function getAlertColor(status?: string) {
  switch (status?.toLowerCase()) {
    case DeploymentStatus.DEPLOYED:
      return 'success';
    case DeploymentStatus.FAILED:
      return 'error';
    case DeploymentStatus.PENDING:
    case DeploymentStatus.PENDINGUPGRADE:
    case DeploymentStatus.PENDINGROLLBACK:
    case DeploymentStatus.UNINSTALLING:
      return 'warn';
    case DeploymentStatus.SUPERSEDED:
    default:
      return 'info';
  }
}
