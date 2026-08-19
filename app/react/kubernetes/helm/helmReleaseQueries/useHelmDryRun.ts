import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import PortainerError from '@/portainer/error';

import { HelmRelease, UpdateHelmReleasePayload } from '../types';

import { updateHelmRelease } from './useUpdateHelmReleaseMutation';
import { queryKeys } from './query-keys';

export function useHelmDryRun(
  environmentId: EnvironmentId,
  payload: UpdateHelmReleasePayload
): UseQueryResult<HelmRelease, PortainerError> {
  return useQuery({
    queryKey: queryKeys.installDryRun(environmentId, payload),
    queryFn: () =>
      // use updateHelmRelease as if it were a get request with dryRun. The payload is debounced to prevent too many requests.
      updateHelmRelease(
        environmentId,
        payload,
        { dryRun: true },
        {
          errorMessage: 'Unable to get Helm manifest preview',
        }
      ),
    // don't display error toast, handle it within the component
    enabled:
      !!payload.repo &&
      !!payload.chart &&
      !!payload.name &&
      !!payload.namespace &&
      !!payload.version,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60, // small 1 minute stale time to reduce the number of requests
  });
}
