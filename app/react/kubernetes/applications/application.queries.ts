import { useMutation, useQuery } from 'react-query';
import { Pod } from 'kubernetes-types/core/v1';

import { queryClient, withError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { getNamespaceServices } from '../services/service';

import {
  getApplicationsForCluster,
  getApplication,
  patchApplication,
  getApplicationRevisionList,
} from './application.service';
import type { AppKind, Application, ApplicationPatch } from './types';
import { deletePod, getNamespacePods } from './pod.service';
import { getNamespaceHorizontalPodAutoscalers } from './autoscaling.service';
import { applicationIsKind, matchLabelsToLabelSelectorValue } from './utils';

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
  applicationRevisions: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string,
    labelSelector?: string
  ) => [
    'environments',
    environmentId,
    'kubernetes',
    'applications',
    namespace,
    name,
    'revisions',
    labelSelector,
  ],
  applicationServices: (
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
    'services',
  ],
  ingressesForApplication: (
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
    'ingresses',
  ],
  applicationHorizontalPodAutoscalers: (
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
    'horizontalpodautoscalers',
  ],
  applicationPods: (
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
    'pods',
  ],
};

// useQuery to get a list of all applications from an array of namespaces
export function useApplicationsForCluster(
  environemtId: EnvironmentId,
  namespaces?: string[]
) {
  return useQuery(
    queryKeys.applicationsForCluster(environemtId),
    () => getApplicationsForCluster(environemtId, namespaces),
    {
      ...withError('Unable to retrieve applications'),
      enabled: !!namespaces?.length,
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
export function useApplicationHorizontalPodAutoscalers(
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
      const filteredHorizontalPodAutoscalers =
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
      return filteredHorizontalPodAutoscalers;
    },
    {
      ...withError(
        `Unable to get horizontal pod autoscalers${
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
  app?: Application
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
    ({ appKind, patch }: { appKind: AppKind; patch: ApplicationPatch }) =>
      patchApplication(environmentId, namespace, appKind, name, patch),
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
