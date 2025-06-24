import { ArrowUp } from 'lucide-react';
import { useRouter } from '@uirouter/react';
import { useState } from 'react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { semverCompare } from '@/react/common/semver-utils';

import { Button, LoadingButton } from '@@/buttons';
import { InlineLoader } from '@@/InlineLoader';
import { Tooltip } from '@@/Tip/Tooltip';
import { Link } from '@@/Link';

import { HelmRelease, UpdateHelmReleasePayload } from '../../types';
import { useUpdateHelmReleaseMutation } from '../../queries/useUpdateHelmReleaseMutation';
import { useHelmRepoVersions } from '../../queries/useHelmRepoVersions';
import { useHelmRelease } from '../queries/useHelmRelease';
import { useHelmRegistries } from '../../queries/useHelmRegistries';

import { openUpgradeHelmModal } from './UpgradeHelmModal';

export function UpgradeButton({
  environmentId,
  releaseName,
  namespace,
  release,
  updateRelease,
}: {
  environmentId: EnvironmentId;
  releaseName: string;
  namespace: string;
  release?: HelmRelease;
  updateRelease: (release: HelmRelease) => void;
}) {
  const router = useRouter();
  const [useCache, setUseCache] = useState(true);
  const updateHelmReleaseMutation = useUpdateHelmReleaseMutation(environmentId);

  const registriesQuery = useHelmRegistries();
  const helmRepoVersionsQuery = useHelmRepoVersions(
    release?.chart.metadata?.name || '',
    60 * 60 * 1000, // 1 hour
    registriesQuery.data,
    useCache
  );
  const versions = helmRepoVersionsQuery.data;

  // Combined loading state
  const isLoading =
    registriesQuery.isInitialLoading || helmRepoVersionsQuery.isFetching; // use 'isFetching' for helmRepoVersionsQuery because we want to show when it's refetching
  const isError = registriesQuery.isError || helmRepoVersionsQuery.isError;
  const latestVersionQuery = useHelmRelease(
    environmentId,
    releaseName,
    namespace,
    {
      select: (data) => data.chart.metadata?.version,
    }
  );
  const latestVersionAvailable = versions[0]?.Version ?? '';
  const isNewVersionAvailable = Boolean(
    latestVersionQuery?.data &&
      semverCompare(latestVersionAvailable, latestVersionQuery?.data) === 1
  );

  const currentRepo = versions?.find(
    (v) =>
      v.Chart === release?.chart.metadata?.name &&
      v.AppVersion === release?.chart.metadata?.appVersion &&
      v.Version === release?.chart.metadata?.version
  )?.Repo;

  const editableHelmRelease: UpdateHelmReleasePayload = {
    name: releaseName,
    namespace: namespace || '',
    values: release?.values?.userSuppliedValues,
    chart: release?.chart.metadata?.name || '',
    appVersion: release?.chart.metadata?.appVersion,
    version: release?.chart.metadata?.version,
    repo: currentRepo ?? '',
  };

  const filteredVersions = currentRepo
    ? versions?.filter((v) => v.Repo === currentRepo) || []
    : versions || [];

  return (
    <div className="relative">
      <LoadingButton
        color="secondary"
        data-cy="k8sApp-upgradeHelmChartButton"
        onClick={handleUpgrade}
        disabled={
          versions.length === 0 ||
          isLoading ||
          isError ||
          release?.info?.status?.startsWith('pending')
        }
        loadingText="Upgrading..."
        isLoading={updateHelmReleaseMutation.isLoading}
        icon={ArrowUp}
        size="medium"
      >
        Upgrade
      </LoadingButton>
      {isLoading && (
        <InlineLoader
          size="xs"
          className="absolute -bottom-5 left-0 right-0 whitespace-nowrap"
        >
          Checking for new versions...
        </InlineLoader>
      )}
      {!isLoading && !isError && (
        <span className="absolute flex items-center -bottom-5 left-0 right-0 text-xs text-muted text-center whitespace-nowrap">
          {getStatusMessage(
            versions.length === 0,
            latestVersionAvailable,
            isNewVersionAvailable
          )}
          {versions.length === 0 && (
            <Tooltip
              message={
                <div>
                  Portainer is unable to find any versions for this chart in the
                  repositories saved. Try adding a new repository which contains
                  the chart in the{' '}
                  <Link
                    to="portainer.account"
                    params={{ '#': 'helm-repositories' }}
                    data-cy="user-settings-link"
                  >
                    Helm repositories settings
                  </Link>
                </div>
              }
            />
          )}
          <Button
            data-cy="k8sApp-refreshHelmChartVersionsButton"
            color="link"
            size="xsmall"
            onClick={handleRefreshVersions}
            type="button"
          >
            Refresh
          </Button>
        </span>
      )}
    </div>
  );

  function handleRefreshVersions() {
    if (useCache) {
      // clicking 'refresh versions' should get the latest versions from the repo, not the cached versions
      setUseCache(false);
    }
    helmRepoVersionsQuery.refetch();
  }

  async function handleUpgrade() {
    const submittedUpgradeValues = await openUpgradeHelmModal(
      editableHelmRelease,
      filteredVersions
    );

    if (submittedUpgradeValues) {
      upgrade(submittedUpgradeValues, release);
    }

    function upgrade(payload: UpdateHelmReleasePayload, release?: HelmRelease) {
      if (release?.info) {
        const updatedRelease = {
          ...release,
          info: {
            ...release.info,
            status: 'pending-upgrade',
            description: 'Preparing upgrade',
          },
        };
        updateRelease(updatedRelease);
      }
      updateHelmReleaseMutation.mutate(payload, {
        onSuccess: () => {
          notifySuccess('Success', 'Helm chart upgraded successfully');
          // set the revision url param to undefined to refresh the page at the latest revision
          router.stateService.go('kubernetes.helm', {
            namespace,
            name: releaseName,
            revision: undefined,
          });
        },
      });
    }
  }
}

function getStatusMessage(
  hasNoAvailableVersions: boolean,
  latestVersionAvailable: string,
  isNewVersionAvailable: boolean
) {
  if (hasNoAvailableVersions) {
    return 'No versions available ';
  }
  if (isNewVersionAvailable) {
    return `New version available (${latestVersionAvailable}) `;
  }
  return 'Latest version installed';
}
