import {
  Deployment,
  DaemonSet,
  StatefulSet,
  ReplicaSetList,
  ControllerRevisionList,
} from 'kubernetes-types/apps/v1';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { isFulfilled } from '@/portainer/helpers/promise-utils';

import { parseKubernetesAxiosError } from '../axiosError';

import { getPod, patchPod } from './pod.service';
import { filterRevisionsByOwnerUid } from './utils';
import { AppKind, Application, ApplicationPatch } from './types';
import { appRevisionAnnotation } from './constants';

// if not known, get the type of an application (Deployment, DaemonSet, StatefulSet or naked pod) by name
export async function getApplication<
  T extends Application | string = Application,
>(
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

export async function patchApplication(
  environmentId: EnvironmentId,
  namespace: string,
  appKind: AppKind,
  name: string,
  patch: ApplicationPatch,
  contentType: string = 'application/json-patch+json'
) {
  switch (appKind) {
    case 'Deployment':
      return patchApplicationByKind<Deployment>(
        environmentId,
        namespace,
        appKind,
        name,
        patch,
        contentType
      );
    case 'DaemonSet':
      return patchApplicationByKind<DaemonSet>(
        environmentId,
        namespace,
        appKind,
        name,
        patch,
        contentType
      );
    case 'StatefulSet':
      return patchApplicationByKind<StatefulSet>(
        environmentId,
        namespace,
        appKind,
        name,
        patch,
        contentType
      );
    case 'Pod':
      return patchPod(environmentId, namespace, name, patch);
    default:
      throw new Error(`Unknown application kind ${appKind}`);
  }
}

async function patchApplicationByKind<T extends Application>(
  environmentId: EnvironmentId,
  namespace: string,
  appKind: 'Deployment' | 'DaemonSet' | 'StatefulSet',
  name: string,
  patch: ApplicationPatch,
  contentType = 'application/json-patch+json'
) {
  try {
    const res = await axios.patch<T>(
      buildUrl(environmentId, namespace, `${appKind}s`, name),
      patch,
      {
        headers: {
          'Content-Type': contentType,
        },
      }
    );
    return res;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to patch application');
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

export async function getApplicationRevisionList(
  environmentId: EnvironmentId,
  namespace: string,
  deploymentUid?: string,
  appKind?: AppKind,
  labelSelector?: string
) {
  if (!deploymentUid) {
    throw new Error('deploymentUid is required');
  }
  try {
    switch (appKind) {
      case 'Deployment': {
        const replicaSetList = await getReplicaSetList(
          environmentId,
          namespace,
          labelSelector
        );
        const replicaSets = replicaSetList.items;
        // keep only replicaset(s) which are owned by the deployment with the given uid
        const replicaSetsWithOwnerId = filterRevisionsByOwnerUid(
          replicaSets,
          deploymentUid
        );
        // keep only replicaset(s) that have been a version of the Deployment
        const replicaSetsWithRevisionAnnotations =
          replicaSetsWithOwnerId.filter(
            (rs) => !!rs.metadata?.annotations?.[appRevisionAnnotation]
          );

        return {
          ...replicaSetList,
          items: replicaSetsWithRevisionAnnotations,
        } as ReplicaSetList;
      }
      case 'DaemonSet':
      case 'StatefulSet': {
        const controllerRevisionList = await getControllerRevisionList(
          environmentId,
          namespace,
          labelSelector
        );
        const controllerRevisions = controllerRevisionList.items;
        // ensure the controller reference(s) is owned by the deployment with the given uid
        const controllerRevisionsWithOwnerId = filterRevisionsByOwnerUid(
          controllerRevisions,
          deploymentUid
        );

        return {
          ...controllerRevisionList,
          items: controllerRevisionsWithOwnerId,
        } as ControllerRevisionList;
      }
      default:
        throw new Error(`Unknown application kind ${appKind}`);
    }
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      `Unable to retrieve revisions for ${appKind}`
    );
  }
}

export async function getReplicaSetList(
  environmentId: EnvironmentId,
  namespace: string,
  labelSelector?: string
) {
  try {
    const { data } = await axios.get<ReplicaSetList>(
      buildUrl(environmentId, namespace, 'ReplicaSets'),
      {
        params: {
          labelSelector,
        },
      }
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(e, 'Unable to retrieve ReplicaSets');
  }
}

export async function getControllerRevisionList(
  environmentId: EnvironmentId,
  namespace: string,
  labelSelector?: string
) {
  try {
    const { data } = await axios.get<ControllerRevisionList>(
      buildUrl(environmentId, namespace, 'ControllerRevisions'),
      {
        params: {
          labelSelector,
        },
      }
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      'Unable to retrieve ControllerRevisions'
    );
  }
}

function buildUrl(
  environmentId: EnvironmentId,
  namespace: string,
  appKind:
    | 'Deployments'
    | 'DaemonSets'
    | 'StatefulSets'
    | 'ReplicaSets'
    | 'ControllerRevisions',
  name?: string
) {
  let baseUrl = `/endpoints/${environmentId}/kubernetes/apis/apps/v1/namespaces/${namespace}/${appKind.toLowerCase()}`;
  if (name) {
    baseUrl += `/${name}`;
  }
  return baseUrl;
}
