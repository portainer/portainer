import { UseQueryResult, useMutation, useQuery } from '@tanstack/react-query';
import { Pod, PodList } from 'kubernetes-types/core/v1';

import {
  queryClient,
  withError,
  withGlobalError,
} from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { getNamespaceServices } from '../services/service';
import { parseKubernetesAxiosError } from '../axiosError';

import {
  getApplication,
  patchApplication,
  getApplicationRevisionList,
} from './application.service';
import type { AppKind, Application, ApplicationPatch } from './types';
import { Application as K8sApplication } from './ListView/ApplicationsDatatable/types';
import { deletePod } from './pod.service';
import { getNamespaceHorizontalPodAutoscalers } from './autoscaling.service';
import { applicationIsKind, matchLabelsToLabelSelectorValue } from './utils';

const queryKeys = {
  applications: (environmentId: EnvironmentId, params?: GetAppsParams) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      params,
    ] as const,
  application: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string,
    yaml?: boolean
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      yaml,
    ] as const,
  applicationRevisions: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string,
    labelSelector?: string
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      'revisions',
      labelSelector,
    ] as const,
  applicationServices: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      'services',
    ] as const,
  ingressesForApplication: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      'ingresses',
    ] as const,
  applicationHorizontalPodAutoscalers: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      'horizontalpodautoscalers',
    ] as const,
  applicationPods: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      'pods',
    ] as const,
};

// when yaml is set to true, the expected return type is a string
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
      ...withError('Unable to retrieve application'),
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

// test if I can get the previous revision
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
      ...withError('Unable to retrieve application revisions'),
      enabled: !!labelSelector && !!appKind && !!deploymentUid,
    }
  );
}

// useApplicationServices returns a query for services that are related to the application (this doesn't include ingresses)
// Filtering the services by the application selector labels is done in the front end because:
// - The label selector query param in the kubernetes API filters by metadata.labels, but we need to filter the services by spec.selector
// - The field selector query param in the kubernetes API can filter the services by spec.selector, but it doesn't support chaining with 'OR',
//   so we can't filter by services with at least one matching label. See: https://kubernetes.io/docs/concepts/overview/working-with-objects/field-selectors/#chained-selectors
export function useApplicationServices(
  environmentId: EnvironmentId,
  namespace: string,
  appName: string,
  app?: Application
) {
  return useQuery(
    queryKeys.applicationServices(environmentId, namespace, appName),
    async () => {
      if (!app) {
        return [];
      }

      // get the selector labels for the application
      const appSelectorLabels = applicationIsKind<Pod>('Pod', app)
        ? app.metadata?.labels
        : app.spec?.template?.metadata?.labels;

      // get all services in the namespace and filter them by the application selector labels
      const services = await getNamespaceServices(environmentId, namespace);
      const filteredServices = services.filter((service) => {
        if (service.spec?.selector && appSelectorLabels) {
          const serviceSelectorLabels = service.spec.selector;
          // include the service if the service selector label matches at least one application selector label
          return Object.keys(appSelectorLabels).some(
            (key) =>
              serviceSelectorLabels[key] &&
              serviceSelectorLabels[key] === appSelectorLabels[key]
          );
        }
        return false;
      });
      return filteredServices;
    },
    { ...withError(`Unable to get services for ${appName}`), enabled: !!app }
  );
}

// useApplicationHorizontalPodAutoscalers returns a query for horizontal pod autoscalers that are related to the application
export function useApplicationHorizontalPodAutoscaler(
  environmentId: EnvironmentId,
  namespace: string,
  appName: string,
  app?: Application
) {
  return useQuery(
    queryKeys.applicationHorizontalPodAutoscalers(
      environmentId,
      namespace,
      appName
    ),
    async () => {
      if (!app) {
        return null;
      }

      const horizontalPodAutoscalers =
        await getNamespaceHorizontalPodAutoscalers(environmentId, namespace);
      const matchingHorizontalPodAutoscaler =
        horizontalPodAutoscalers.find((horizontalPodAutoscaler) => {
          const scaleTargetRef = horizontalPodAutoscaler.spec?.scaleTargetRef;
          if (scaleTargetRef) {
            const scaleTargetRefName = scaleTargetRef.name;
            const scaleTargetRefKind = scaleTargetRef.kind;
            // include the horizontal pod autoscaler if the scale target ref name and kind match the application name and kind
            return (
              scaleTargetRefName === app.metadata?.name &&
              scaleTargetRefKind === app.kind
            );
          }
          return false;
        }) || null;
      return matchingHorizontalPodAutoscaler;
    },
    {
      ...withError(
        `Unable to get horizontal pod autoscaler${
          app ? ` for ${app.metadata?.name}` : ''
        }`
      ),
      enabled: !!app,
    }
  );
}

// useApplicationPods returns a query for pods that are related to the application by the application selector labels
export function useApplicationPods(
  environmentId: EnvironmentId,
  namespace: string,
  appName: string,
  app?: Application,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.applicationPods(environmentId, namespace, appName),
    async () => {
      if (applicationIsKind<Pod>('Pod', app)) {
        return [app];
      }
      const appSelector = app?.spec?.selector;
      const labelSelector = matchLabelsToLabelSelectorValue(
        appSelector?.matchLabels
      );

      // get all pods in the namespace using the application selector as the label selector query param
      const pods = await getNamespacePods(
        environmentId,
        namespace,
        labelSelector
      );
      return pods;
    },
    {
      ...withError(`Unable to get pods for ${appName}`),
      enabled: !!app,
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}

async function getNamespacePods(
  environmentId: EnvironmentId,
  namespace: string,
  labelSelector?: string
) {
  try {
    const { data } = await axios.get<PodList>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/pods`,
      {
        params: {
          labelSelector,
        },
      }
    );
    const items = (data.items || []).map(
      (pod) =>
        <Pod>{
          ...pod,
          kind: 'Pod',
          apiVersion: data.apiVersion,
        }
    );
    return items;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      `Unable to retrieve Pods in namespace '${namespace}'`
    );
  }
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

// useRedeployApplicationMutation gets all the pods for an application (using the matchLabels field in the labelSelector query param) and then deletes all of them, so that they are recreated
export function useRedeployApplicationMutation(
  environmentId: number,
  namespace: string,
  name: string
) {
  return useMutation(
    async ({ labelSelector }: { labelSelector: string }) => {
      try {
        // get only the pods that match the labelSelector for the application
        const pods = await getNamespacePods(
          environmentId,
          namespace,
          labelSelector
        );
        // delete all the pods to redeploy the application
        await Promise.all(
          pods.map((pod) => {
            if (pod?.metadata?.name) {
              return deletePod(environmentId, namespace, pod.metadata.name);
            }
            return Promise.resolve();
          })
        );
      } catch (error) {
        throw new Error(`Unable to redeploy application: ${error}`);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(
          queryKeys.application(environmentId, namespace, name)
        );
      },
      ...withError('Unable to redeploy application'),
    }
  );
}

type GetAppsParams = {
  namespace?: string;
  nodeName?: string;
  withDependencies?: boolean;
};

type GetAppsQueryOptions = {
  refetchInterval?: number;
} & GetAppsParams;

// useQuery to get a list of all applications from an array of namespaces
export function useApplications(
  environmentId: EnvironmentId,
  queryOptions?: GetAppsQueryOptions
) {
  const { refetchInterval, ...params } = queryOptions ?? {};
  return useQuery(
    queryKeys.applications(environmentId, params),
    () => getApplications(environmentId, params),
    {
      refetchInterval,
      ...withGlobalError('Unable to retrieve applications'),
    }
  );
}

// get all applications from a namespace
export async function getApplications(
  environmentId: EnvironmentId,
  params?: GetAppsParams
) {
  try {
    const { data } = await axios.get<K8sApplication[]>(
      `/kubernetes/${environmentId}/applications`,
      { params }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve applications');
  }
}
