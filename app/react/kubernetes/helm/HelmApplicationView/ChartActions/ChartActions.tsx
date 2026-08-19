import { EnvironmentId } from '@/react/portainer/environments/types';

import { HelmRelease } from '../../types';

import { RollbackButton } from './RollbackButton';
import { UninstallButton } from './UninstallButton';
import { UpgradeButton } from './UpgradeButton';

type Props = {
  environmentId: EnvironmentId;
  releaseName: string;
  namespace: string;
  latestRevision?: number;
  earlistRevision?: number;
  selectedRevision?: number;
  release?: HelmRelease;
  updateRelease: (release: HelmRelease) => void;
};

export function ChartActions({
  environmentId,
  releaseName,
  namespace,
  latestRevision,
  earlistRevision,
  selectedRevision,
  release,
  updateRelease,
}: Props) {
  const showRollbackButton =
    latestRevision && earlistRevision && latestRevision > earlistRevision;

  return (
    <div className="inline-flex flex-wrap gap-2">
      <UpgradeButton
        environmentId={environmentId}
        releaseName={releaseName}
        namespace={namespace}
        release={release}
        updateRelease={updateRelease}
      />
      {showRollbackButton && (
        <RollbackButton
          latestRevision={latestRevision}
          selectedRevision={selectedRevision}
          environmentId={environmentId}
          releaseName={releaseName}
          namespace={namespace}
        />
      )}
      <UninstallButton
        environmentId={environmentId}
        releaseName={releaseName}
        namespace={namespace}
      />
    </div>
  );
}
