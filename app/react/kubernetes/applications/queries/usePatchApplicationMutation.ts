import { useMutation } from '@tanstack/react-query';
import { Deployment, DaemonSet, StatefulSet } from 'kubernetes-types/apps/v1';
import { Pod } from 'kubernetes-types/core/v1';

import { queryClient } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import type { AppKind, ApplicationPatch, Application } from '../types';
import { parseKubernetesAxiosError } from '../../axiosError';

import { queryKeys } from './query-keys';

// useQuery to patch an application by environmentId, namespace, name and patch payload
export function usePatchApplicationMutation(
  environmentId: EnvironmentId,
  namespace: string,
  name: string
) {
  return useMutation(
    ({
      appKind,
      patch,
      contentType = 'application/json-patch+json',
    }: {
      appKind: AppKind;
      patch: ApplicationPatch;
      contentType?:
        | 'application/json-patch+json'
        | 'application/strategic-merge-patch+json';
    }) =>
      patchApplication(
        environmentId,
        namespace,
        appKind,
        name,
        patch,
        contentType
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(
          queryKeys.application(environmentId, namespace, name)
        );
      },
      // patch application is used for patching and rollbacks, so handle the error where it's used instead of here
    }
  );
}

async function patchApplication(
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

async function patchPod(
  environmentId: EnvironmentId,
  namespace: string,
  name: string,
  patch: ApplicationPatch
) {
  try {
    return await axios.patch<Pod>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/pods/${name}`,
      patch,
      {
        headers: {
          'Content-Type': 'application/json-patch+json',
        },
      }
    );
  } catch (e) {
    throw parseAxiosError(e, 'Unable to update pod');
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
