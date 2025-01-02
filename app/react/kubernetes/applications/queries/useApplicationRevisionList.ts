import { useQuery } from '@tanstack/react-query';
import {
  ReplicaSetList,
  ControllerRevisionList,
} from 'kubernetes-types/apps/v1';

import { withGlobalError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { AppKind } from '../types';
import { appRevisionAnnotation } from '../constants';
import { filterRevisionsByOwnerUid } from '../utils';
import { parseKubernetesAxiosError } from '../../axiosError';

import { queryKeys } from './query-keys';

// useQuery to get an application's previous revision by environmentId, namespace, appKind and labelSelector
export function useApplicationRevisionList(
  environmentId: EnvironmentId,
  namespace: string,
  name: string,
  deploymentUid?: string,
  labelSelector?: string,
  appKind?: AppKind
) {
  return useQuery(
    queryKeys.applicationRevisions(
      environmentId,
      namespace,
      name,
      labelSelector
    ),
    () =>
      getApplicationRevisionList(
        environmentId,
        namespace,
        deploymentUid,
        appKind,
        labelSelector
      ),
    {
      ...withGlobalError('Unable to retrieve application revisions'),
      enabled: !!labelSelector && !!appKind && !!deploymentUid,
    }
  );
}

async function getApplicationRevisionList(
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

async function getReplicaSetList(
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

async function getControllerRevisionList(
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
