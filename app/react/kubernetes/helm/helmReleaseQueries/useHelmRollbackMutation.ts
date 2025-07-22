import { useMutation } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  queryClient,
  withInvalidate,
  withGlobalError,
} from '@/react-tools/react-query';
import axios from '@/portainer/services/axios';
import { queryKeys as applicationsQueryKeys } from '@/react/kubernetes/applications/queries/query-keys';

import { queryKeys } from './query-keys';

/**
 * Parameters for helm rollback operation
 *
 * @see https://helm.sh/docs/helm/helm_rollback/
 */
interface RollbackQueryParams {
  /** Optional namespace for the release (defaults to "default" if not specified) */
  namespace?: string;
  /** Revision to rollback to (if omitted or set to 0, rolls back to the previous release) */
  revision?: number;
  /** If set, waits until resources are in a ready state before marking the release as successful (default: false) */
  wait?: boolean;
  /** If set and --wait enabled, waits until all Jobs have been completed before marking the release as successful (default: false) */
  waitForJobs?: boolean;
  /** Performs pods restart for the resources if applicable (default: true) */
  recreate?: boolean;
  /** Force resource update through delete/recreate if needed (default: false) */
  force?: boolean;
  /** Time to wait for any individual Kubernetes operation in seconds (default: 300) */
  timeout?: number;
}

interface RollbackPayload {
  releaseName: string;
  params: RollbackQueryParams;
}

async function rollbackRelease({
  releaseName,
  params,
  environmentId,
}: RollbackPayload & { environmentId: EnvironmentId }) {
  return axios.post<Record<string, unknown>>(
    `/endpoints/${environmentId}/kubernetes/helm/${releaseName}/rollback`,
    null,
    { params }
  );
}

export function useHelmRollbackMutation(environmentId: EnvironmentId) {
  return useMutation({
    mutationFn: ({ releaseName, params }: RollbackPayload) =>
      rollbackRelease({ releaseName, params, environmentId }),
    ...withGlobalError('Unable to rollback Helm release'),
    ...withInvalidate(queryClient, [
      queryKeys.releases(environmentId),
      applicationsQueryKeys.applications(environmentId),
    ]),
  });
}
