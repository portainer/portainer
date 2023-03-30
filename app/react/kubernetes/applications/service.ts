import { Pod, PodList } from 'kubernetes-types/core/v1';
import {
  Deployment,
  DeploymentList,
  DaemonSet,
  DaemonSetList,
  StatefulSet,
  StatefulSetList,
} from 'kubernetes-types/apps/v1';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

export async function getApplicationsListForCluster(
  environmentId: EnvironmentId,
  namespaces: string[]
) {
  try {
    const applications = await Promise.all(
      namespaces.map((namespace) =>
        getApplicationsListForNamespace(environmentId, namespace)
      )
    );
    return applications.flat();
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve applications for cluster'
    );
  }
}

// get a list of all Deployments, DaemonSets and StatefulSets in one namespace
export async function getApplicationsListForNamespace(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const [deployments, daemonSets, statefulSets, pods] = await Promise.all([
      getDeployments(environmentId, namespace),
      getDaemonSets(environmentId, namespace),
      getStatefulSets(environmentId, namespace),
      getPods(environmentId, namespace),
    ]);
    // find all pods which are 'naked' (not owned by a deployment, daemonset or statefulset)
    const nakedPods = getNakedPods(pods, deployments, daemonSets, statefulSets);
    return [...deployments, ...daemonSets, ...statefulSets, ...nakedPods];
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      `Unable to retrieve applications in namespace ${namespace}`
    );
  }
}

async function getDeployments(environmentId: EnvironmentId, namespace: string) {
  try {
    const { data } = await axios.get<DeploymentList>(
      buildUrl(environmentId, namespace, 'deployments')
    );
    return data.items;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve deployments');
  }
}

async function getDaemonSets(environmentId: EnvironmentId, namespace: string) {
  try {
    const { data } = await axios.get<DaemonSetList>(
      buildUrl(environmentId, namespace, 'daemonsets')
    );
    return data.items;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve daemonsets');
  }
}

async function getStatefulSets(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data } = await axios.get<StatefulSetList>(
      buildUrl(environmentId, namespace, 'statefulsets')
    );
    return data.items;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve statefulsets');
  }
}

async function getPods(environmentId: EnvironmentId, namespace: string) {
  try {
    const { data } = await axios.get<PodList>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/pods`
    );
    return data.items;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve pods');
  }
}

function buildUrl(
  environmentId: EnvironmentId,
  namespace: string,
  appResource: 'deployments' | 'daemonsets' | 'statefulsets'
) {
  return `/endpoints/${environmentId}/kubernetes/apis/apps/v1/namespaces/${namespace}/${appResource}`;
}

function getNakedPods(
  pods: Pod[],
  deployments: Deployment[],
  daemonSets: DaemonSet[],
  statefulSets: StatefulSet[]
) {
  // naked pods are pods which are not owned by a deployment, daemonset, statefulset or replicaset
  // https://kubernetes.io/docs/concepts/configuration/overview/#naked-pods-vs-replicasets-deployments-and-jobs
  const appLabels = [
    ...deployments.map((deployment) => deployment.spec?.selector.matchLabels),
    ...daemonSets.map((daemonSet) => daemonSet.spec?.selector.matchLabels),
    ...statefulSets.map(
      (statefulSet) => statefulSet.spec?.selector.matchLabels
    ),
  ];

  const nakedPods = pods.filter((pod) => {
    const podLabels = pod.metadata?.labels;
    // if the pod has no labels, it is naked
    if (!podLabels) return true;
    // if the pod has labels, but no app labels, it is naked
    return !appLabels.some((appLabel) => {
      if (!appLabel) return false;
      return Object.entries(appLabel).every(
        ([key, value]) => podLabels[key] === value
      );
    });
  });

  return nakedPods;
}
