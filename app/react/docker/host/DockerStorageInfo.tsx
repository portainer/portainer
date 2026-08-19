import { isVersionSmaller } from '@/react/common/semver-utils';
import { humanize } from '@/portainer/filters/filters';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { getPlatformTypeName } from '@/react/portainer/environments/utils';

import { ProgressBar } from '@@/ProgressBar';
import { Tooltip } from '@@/Tip/Tooltip/Tooltip';
import { InlineLoader } from '@@/InlineLoader/InlineLoader';

import { useDockerStorageUsageQuery } from '../queries/useDockerStorageUsageQuery';

const MIN_AGENT_VERSION = '2.42.0';

export function DockerStorageInfo({
  endpointId,
}: {
  endpointId: EnvironmentId;
}) {
  const environmentQuery = useEnvironment(endpointId);
  const environment = environmentQuery.data;
  const agentVersion = environment?.Agent.Version;

  const dockerStorageUsageQuery = useDockerStorageUsageQuery(endpointId, {
    enabled: !!environment,
  });
  const dockerStorageUsage = dockerStorageUsageQuery.data;

  if (environmentQuery.isLoading || dockerStorageUsageQuery.isLoading) {
    return <InlineLoader>Loading storage information...</InlineLoader>;
  }

  if (dockerStorageUsageQuery.isError) {
    const errorMessage =
      dockerStorageUsageQuery.error instanceof Error
        ? dockerStorageUsageQuery.error.message
        : 'Unknown error';

    const needsUpgrade =
      environmentQuery.isFetched &&
      // Empty version means a pre-2.15 agent that doesn't report its version —
      // definitely predates docker-storage support.
      (!agentVersion || isVersionSmaller(agentVersion, MIN_AGENT_VERSION));
    const minAgentVersionMessage = `Disk usage requires agent version ${MIN_AGENT_VERSION} or later. Upgrade your agent to enable this feature.`;

    return (
      <span className="flex items-center">
        <span className="text-muted small">Not available</span>
        <Tooltip
          message={needsUpgrade ? minAgentVersionMessage : errorMessage}
        />
      </span>
    );
  }

  if (!environment) {
    return (
      <span className="flex items-center">
        <span className="text-muted small">Not available</span>
        <Tooltip message="Unable to read environment information." />
      </span>
    );
  }

  const platformName = getPlatformTypeName(
    environment.Type,
    environment.ContainerEngine
  );

  if (dockerStorageUsage?.totalBytes === undefined) {
    return (
      <span className="flex items-center">
        <span className="text-muted small">Not available</span>
        <Tooltip
          message={`The agent could not determine ${platformName} storage usage. Ensure the ${platformName} socket and host filesystem are accessible to the agent.`}
        />
      </span>
    );
  }

  const dockerBytes = dockerStorageUsage.dockerBytes;
  const otherBytes = Math.max(
    0,
    dockerStorageUsage.totalBytes -
      dockerStorageUsage.availableBytes -
      dockerBytes
  );

  return (
    <>
      <div className="flex items-center gap-2">
        {/* The progress bar is purely visual — all data is in the text legend below */}
        <div aria-hidden="true" className="flex-1">
          <ProgressBar
            steps={[
              {
                value: dockerBytes,
                className: 'progress-bar !bg-blue-7',
              },
              {
                value: otherBytes,
                className: 'progress-bar !bg-warning-8',
              },
            ]}
            total={dockerStorageUsage.totalBytes}
            className="!w-full"
          />
        </div>
        <span className="small text-muted shrink-0" aria-label="Total capacity">
          {humanize(dockerStorageUsage.totalBytes)}
        </span>
      </div>
      <div
        className="flex flex-wrap justify-between gap-2"
        role="list"
        aria-label="Disk usage breakdown"
      >
        <div className="mt-1 flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1" role="listitem">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-sm bg-blue-7"
            />
            <span>
              {platformName} ({humanize(dockerBytes)})
            </span>
            <Tooltip
              message={
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between gap-4">
                    <span>Images</span>
                    <span>{humanize(dockerStorageUsage.imageBytes)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Containers</span>
                    <span>{humanize(dockerStorageUsage.containerBytes)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Volumes</span>
                    <span>{humanize(dockerStorageUsage.volumeBytes)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Build cache</span>
                    <span>{humanize(dockerStorageUsage.buildCacheBytes)}</span>
                  </div>
                </div>
              }
            />
          </span>
          <span className="flex items-center gap-1" role="listitem">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-sm bg-warning-8"
            />
            <span>Other ({humanize(otherBytes)})</span>
          </span>
          <span className="flex items-center gap-1" role="listitem">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-sm bg-gray-5"
            />
            <span>Free ({humanize(dockerStorageUsage.availableBytes)})</span>
          </span>
        </div>
        <div className="text-muted mt-1 text-xs" role="listitem">
          Partition: <code className="px-0">{dockerStorageUsage.rootDir}</code>
        </div>
      </div>
    </>
  );
}
