import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HorizontalPodAutoscaler } from 'kubernetes-types/autoscaling/v2';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { getAllSettledItems } from '@/portainer/helpers/promise-utils';
import { withGlobalError } from '@/react-tools/react-query';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { pluralize } from '@/portainer/helpers/strings';

import { parseKubernetesAxiosError } from '../../axiosError';
import { ApplicationRowData } from '../ListView/ApplicationsDatatable/types';
import { Stack } from '../ListView/ApplicationsStacksDatatable/types';
import { deleteServices } from '../../services/service';
import { updateIngress } from '../../ingresses/service';
import { Ingress } from '../../ingresses/types';

import { queryKeys } from './query-keys';

export function useDeleteApplicationsMutation({
  environmentId,
  stacks,
  ingresses,
  reportStacks,
}: {
  environmentId: EnvironmentId;
  stacks: Stack[];
  ingresses: Ingress[];
  reportStacks?: boolean;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applications: ApplicationRowData[]) =>
      deleteApplications(applications, stacks, ingresses, environmentId),
    // apps and stacks deletions results (success and error) are handled here
    onSuccess: ({
      settledAppDeletions,
      settledStackDeletions,
      settledIngressUpdates,
      settledHpaDeletions,
    }) => {
      // one error notification per rejected item
      settledAppDeletions.rejectedItems.forEach(({ item, reason }) => {
        notifyError(
          `Failed to remove application '${item.Name}'`,
          new Error(reason)
        );
      });
      settledStackDeletions.rejectedItems.forEach(({ item, reason }) => {
        notifyError(`Failed to remove stack '${item.Name}'`, new Error(reason));
      });
      settledIngressUpdates.rejectedItems.forEach(({ item, reason }) => {
        notifyError(
          `Failed to update ingress paths for '${item.Name}'`,
          new Error(reason)
        );
      });
      settledHpaDeletions.rejectedItems.forEach(({ item, reason }) => {
        notifyError(
          `Failed to remove horizontal pod autoscaler for '${item.metadata?.name}'`,
          new Error(reason)
        );
      });

      // one success notification for all fulfilled items
      if (settledAppDeletions.fulfilledItems.length && !reportStacks) {
        notifySuccess(
          `${pluralize(
            settledAppDeletions.fulfilledItems.length,
            'Application'
          )} successfully removed`,
          settledAppDeletions.fulfilledItems.map((item) => item.Name).join(', ')
        );
      }
      if (settledStackDeletions.fulfilledItems.length && reportStacks) {
        notifySuccess(
          `${pluralize(
            settledStackDeletions.fulfilledItems.length,
            'Stack'
          )} successfully removed`,
          settledStackDeletions.fulfilledItems
            .map((item) => item.Name)
            .join(', ')
        );
      }
      // dont notify successful ingress updates to avoid notification spam
      queryClient.invalidateQueries(queryKeys.applications(environmentId));
    },
    // failed service deletions are handled here
    onError: (error: unknown) => {
      notifyError('Unable to remove applications', error as Error);
    },
    ...withGlobalError('Unable to remove applications'),
  });
}

async function deleteApplications(
  applications: ApplicationRowData[],
  stacks: Stack[],
  ingresses: Ingress[],
  environmentId: EnvironmentId
) {
  const settledAppDeletions = await getAllSettledItems(
    applications,
    (application) => deleteApplication(application, stacks, environmentId)
  );

  // Delete stacks that have no applications left (stacks object has been mutated by deleteApplication)
  const stacksToDelete = stacks.filter(
    (stack) => stack.Applications.length === 0
  );
  const settledStackDeletions = await getAllSettledItems(
    stacksToDelete,
    (stack) => deleteStack(stack, environmentId)
  );

  // update associated k8s ressources
  // helm uninstall will update associated k8s ressources for helm apps, so don't manually delete Helm app associated k8s resources
  const nonHelmApplications = applications.filter(
    (app) => app.ApplicationType !== 'Helm'
  );
  const servicesToDelete = getServicesFromApplications(nonHelmApplications);
  // axios error handling is done inside deleteServices already
  if (Object.keys(servicesToDelete).length > 0) {
    await deleteServices({
      environmentId,
      data: servicesToDelete,
    });
  }
  const hpasToDelete = nonHelmApplications
    .map((app) => app.HorizontalPodAutoscaler)
    .filter((hpa) => !!hpa);
  const settledHpaDeletions = await getAllSettledItems(hpasToDelete, (hpa) =>
    deleteHorizontalPodAutoscaler(hpa, environmentId)
  );
  const updatedIngresses = getUpdatedIngressesWithRemovedPaths(
    ingresses,
    servicesToDelete
  );
  const settledIngressUpdates = await getAllSettledItems(
    updatedIngresses,
    (ingress) => updateIngress(environmentId, ingress)
  );

  return {
    settledAppDeletions,
    settledStackDeletions,
    settledIngressUpdates,
    settledHpaDeletions,
  };
}

function getServicesFromApplications(
  applications: ApplicationRowData[]
): Record<string, string[]> {
  return applications.reduce<Record<string, string[]>>(
    (namespaceServicesMap, application) => {
      const serviceNames =
        application.Services?.map((service) => service.metadata?.name).filter(
          (name) => name !== undefined
        ) || [];
      const existingServices =
        namespaceServicesMap[application.ResourcePool] || [];
      const uniqueServicesForNamespace = Array.from(
        new Set([...existingServices, ...serviceNames])
      );
      return {
        ...namespaceServicesMap,
        [application.ResourcePool]: uniqueServicesForNamespace,
      };
    },
    {}
  );
}

// return a list of ingresses, which need updated because their paths should be removed for deleted services.
function getUpdatedIngressesWithRemovedPaths(
  ingresses: Ingress[],
  servicesToDelete: Record<string, string[]>
) {
  return ingresses.reduce<Ingress[]>((updatedIngresses, ingress) => {
    if (!ingress.Paths) {
      return updatedIngresses;
    }
    const servicesInNamespace = servicesToDelete[ingress.Namespace] || [];
    // filter out the paths for services that are in the list of services to delete
    const updatedIngressPaths =
      ingress.Paths.filter(
        (path) => !servicesInNamespace.includes(path.ServiceName)
      ) ?? [];
    if (updatedIngressPaths.length !== ingress.Paths?.length) {
      return [...updatedIngresses, { ...ingress, Paths: updatedIngressPaths }];
    }
    return updatedIngresses;
  }, []);
}

async function deleteStack(stack: Stack, environmentId: EnvironmentId) {
  try {
    await axios.delete(`/stacks/name/${stack.Name}`, {
      params: {
        external: false,
        name: stack.Name,
        endpointId: environmentId,
        namespace: stack.ResourcePool,
      },
    });
  } catch (error) {
    throw parseAxiosError(error, 'Unable to remove stack');
  }
}

async function deleteApplication(
  application: ApplicationRowData,
  stacks: Stack[],
  environmentId: EnvironmentId
) {
  switch (application.ApplicationType) {
    case 'Deployment':
    case 'DaemonSet':
    case 'StatefulSet':
      await deleteKubernetesApplication(application, stacks, environmentId);
      break;
    case 'Pod':
      await deletePodApplication(application, stacks, environmentId);
      break;
    case 'Helm':
      await uninstallHelmApplication(application, environmentId);
      break;
    default:
      throw new Error(
        `Unknown application type: ${application.ApplicationType}`
      );
  }
}

async function deleteKubernetesApplication(
  application: ApplicationRowData,
  stacks: Stack[],
  environmentId: EnvironmentId
) {
  try {
    await axios.delete(
      `/endpoints/${environmentId}/kubernetes/apis/apps/v1/namespaces/${
        application.ResourcePool
      }/${application.ApplicationType.toLowerCase()}s/${application.Name}`
    );
    removeApplicationFromStack(application, stacks);
  } catch (error) {
    throw parseKubernetesAxiosError(error, 'Unable to remove application');
  }
}

async function deletePodApplication(
  application: ApplicationRowData,
  stacks: Stack[],
  environmentId: EnvironmentId
) {
  try {
    await axios.delete(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${application.ResourcePool}/pods/${application.Name}`
    );
    removeApplicationFromStack(application, stacks);
  } catch (error) {
    throw parseKubernetesAxiosError(error, 'Unable to remove application');
  }
}

async function uninstallHelmApplication(
  application: ApplicationRowData,
  environmentId: EnvironmentId
) {
  try {
    await axios.delete(
      `/endpoints/${environmentId}/kubernetes/helm/${application.Name}`,
      { params: { namespace: application.ResourcePool } }
    );
  } catch (error) {
    // parseAxiosError, because it's a regular portainer api error
    throw parseAxiosError(error, 'Unable to remove application');
  }
}

async function deleteHorizontalPodAutoscaler(
  hpa: HorizontalPodAutoscaler,
  environmentId: EnvironmentId
) {
  try {
    await axios.delete(
      `/endpoints/${environmentId}/kubernetes/apis/autoscaling/v2/namespaces/${hpa.metadata?.namespace}/horizontalpodautoscalers/${hpa.metadata?.name}`
    );
  } catch (error) {
    throw parseKubernetesAxiosError(
      error,
      'Unable to remove horizontal pod autoscaler'
    );
  }
}

// mutate the stacks array to remove the application
function removeApplicationFromStack(
  application: ApplicationRowData,
  stacks: Stack[]
) {
  const stack = stacks.find(
    (stack) =>
      stack.Name === application.StackName &&
      stack.ResourcePool === application.ResourcePool
  );
  if (stack) {
    stack.Applications = stack.Applications.filter(
      (app) => app.Name !== application.Name
    );
  }
}
