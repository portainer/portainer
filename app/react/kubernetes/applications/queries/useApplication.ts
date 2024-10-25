import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { DaemonSet, Deployment, StatefulSet } from 'kubernetes-types/apps/v1';
import { Pod } from 'kubernetes-types/core/v1';

import { withGlobalError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { isFulfilled } from '@/portainer/helpers/promise-utils';
import axios from '@/portainer/services/axios';

import { AppKind, Application } from '../types';
import { parseKubernetesAxiosError } from '../../axiosError';

import { queryKeys } from './query-keys';

/**
 * @returns an application from the Kubernetes API proxy (deployment, statefulset, daemonSet or pod)
 * when yaml is set to true, the expected return type is a string
 */
export function useApplication<T extends Application | string = Application>(
  environmentId: EnvironmentId,
  namespace: string,
  name: string,
  appKind?: AppKind,
  options?: { autoRefreshRate?: number; yaml?: boolean }
): UseQueryResult<T> {
  return useQuery(
    queryKeys.application(environmentId, namespace, name, options?.yaml),
    () =>
      getApplication<T>(environmentId, namespace, name, appKind, options?.yaml),
    {
      ...withGlobalError('Unable to retrieve application'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

// if not known, get the type of an application (Deployment, DaemonSet, StatefulSet or naked pod) by name
async function getApplication<T extends Application | string = Application>(
  environmentId: EnvironmentId,
  namespace: string,
  name: string,
  appKind?: AppKind,
  yaml?: boolean
) {
  // if resourceType is known, get the application by type and name
  if (appKind) {
    switch (appKind) {
      case 'Deployment':
      case 'DaemonSet':
      case 'StatefulSet':
        return getApplicationByKind<T>(
          environmentId,
          namespace,
          appKind,
          name,
          yaml
        );
      case 'Pod':
        return getPod(environmentId, namespace, name, yaml);
      default:
        throw new Error('Unknown resource type');
    }
  }

  // if resourceType is not known, get the application by name and return the first one that is fulfilled
  const [deployment, daemonSet, statefulSet, pod] = await Promise.allSettled([
    getApplicationByKind<Deployment>(
      environmentId,
      namespace,
      'Deployment',
      name,
      yaml
    ),
    getApplicationByKind<DaemonSet>(
      environmentId,
      namespace,
      'DaemonSet',
      name,
      yaml
    ),
    getApplicationByKind<StatefulSet>(
      environmentId,
      namespace,
      'StatefulSet',
      name,
      yaml
    ),
    getPod(environmentId, namespace, name, yaml),
  ]);

  if (isFulfilled(deployment)) {
    return deployment.value;
  }
  if (isFulfilled(daemonSet)) {
    return daemonSet.value;
  }
  if (isFulfilled(statefulSet)) {
    return statefulSet.value;
  }
  if (isFulfilled(pod)) {
    return pod.value;
  }
  throw new Error('Unable to retrieve application');
}

async function getPod<T extends Pod | string = Pod>(
  environmentId: EnvironmentId,
  namespace: string,
  name: string,
  yaml?: boolean
) {
  try {
    const { data } = await axios.get<T>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/pods/${name}`,
      {
        headers: { Accept: yaml ? 'application/yaml' : 'application/json' },
      }
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve pod');
  }
}

async function getApplicationByKind<
  T extends Application | string = Application,
>(
  environmentId: EnvironmentId,
  namespace: string,
  appKind: 'Deployment' | 'DaemonSet' | 'StatefulSet',
  name: string,
  yaml?: boolean
) {
  try {
    const { data } = await axios.get<T>(
      buildUrl(environmentId, namespace, `${appKind}s`, name),
      {
        headers: { Accept: yaml ? 'application/yaml' : 'application/json' },
        // this logic is to get the latest YAML response
        // axios-cache-adapter looks for the response headers to determine if the response should be cached
        // to avoid writing requestInterceptor, adding a query param to the request url
        params: yaml
          ? {
              _: Date.now(),
            }
          : null,
      }
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve application');
  }
}

function buildUrl(
  environmentId: EnvironmentId,
  namespace: string,
  appKind: 'Deployments' | 'DaemonSets' | 'StatefulSets',
  name?: string
) {
  let baseUrl = `/endpoints/${environmentId}/kubernetes/apis/apps/v1/namespaces/${namespace}/${appKind.toLowerCase()}`;
  if (name) {
    baseUrl += `/${name}`;
  }
  return baseUrl;
}
