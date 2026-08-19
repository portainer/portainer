import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

/**
 * Disk storage snapshot for the partition backing Docker's data directory.
 * Returned by the agent's docker-storage endpoint (200 OK).
 * A 204 response means the agent is reachable but could not determine usage
 * (e.g. Docker socket or host filesystem not accessible).
 */
type DockerStorageUsage = {
  /** Filesystem path used to measure disk capacity. */
  rootDir: string;
  /** Total capacity of the partition in bytes. */
  totalBytes: number;
  /** Bytes consumed by Docker artifacts (images, container layers, volumes, build cache). */
  dockerBytes: number;
  /** Deduplicated image layer data (LayersSize from docker system df). */
  imageBytes: number;
  /** Sum of writable-layer sizes across all containers (SizeRw). Image layers excluded. */
  containerBytes: number;
  /** Sum of known volume sizes. Volumes with unknown sizes (non-local drivers) excluded. */
  volumeBytes: number;
  /** Sum of all build cache entry sizes. */
  buildCacheBytes: number;
  /** Bytes available to unprivileged processes. Non-Docker used = totalBytes - availableBytes - dockerBytes. */
  availableBytes: number;
};

const queryKeys = {
  dockerStorage: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'docker', 'storage'] as const,
};

export function useDockerStorageUsageQuery(
  environmentId: EnvironmentId,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery(
    queryKeys.dockerStorage(environmentId),
    () => getDockerStorageUsage(environmentId),
    {
      retry: false,
      enabled,
    }
  );
}

async function getDockerStorageUsage(
  environmentId: EnvironmentId
): Promise<DockerStorageUsage | undefined> {
  try {
    const { data } = await axios.get<DockerStorageUsage | null>(
      `/endpoints/${environmentId}/agent/host/docker-storage`,
      // Accept 204: agent reachable but storage info unavailable (returns null body).
      { validateStatus: (s) => s === 200 || s === 204 }
    );
    // Normalise null (204 body) to undefined so callers can use a single undefined check.
    return data ?? undefined;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get Docker storage usage');
  }
}
