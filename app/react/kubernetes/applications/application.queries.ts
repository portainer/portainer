import { useMutation, useQuery } from 'react-query';

import { queryClient, withError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import {
  getApplicationsForCluster,
  getApplication,
  patchApplication,
} from './application.service';
import { AppKind } from './types';

const queryKeys = {
  applicationsForCluster: (environmentId: EnvironmentId) => [
    'environments',
    environmentId,
    'kubernetes',
    'applications',
  ],
  application: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string
  ) => [
    'environments',
    environmentId,
    'kubernetes',
    'applications',
    namespace,
    name,
  ],
};

// useQuery to get a list of all applications from an array of namespaces
export function useApplicationsForCluster(
  environemtId: EnvironmentId,
  namespaces?: string[]
) {
  return useQuery(
    queryKeys.applicationsForCluster(environemtId),
    () => namespaces && getApplicationsForCluster(environemtId, namespaces),
    {
      ...withError('Unable to retrieve applications'),
      enabled: !!namespaces,
    }
  );
}

// useQuery to get an application by environmentId, namespace and name
export function useApplication(
  environmentId: EnvironmentId,
  namespace: string,
  name: string,
  appKind?: AppKind
) {
  return useQuery(
    queryKeys.application(environmentId, namespace, name),
    () => getApplication(environmentId, namespace, name, appKind),
    {
      ...withError('Unable to retrieve application'),
    }
  );
}

// useQuery to patch an application by environmentId, namespace, name and patch payload
export function usePatchApplicationMutation(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  return useMutation(
    ({
      appKind,
      path,
      value,
    }: {
      appKind: AppKind;
      path: string;
      value: string;
    }) =>
      patchApplication(environmentId, namespace, appKind, name, path, value),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(
          queryKeys.application(environmentId, namespace, name)
        );
      },
    }
  );
}
