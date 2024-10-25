import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { getAllSettledItems } from '@/portainer/helpers/promise-utils';
import { withGlobalError } from '@/react-tools/react-query';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { pluralize } from '@/portainer/helpers/strings';

import { parseKubernetesAxiosError } from '../../axiosError';
import { ApplicationRowData } from '../ListView/ApplicationsDatatable/types';
import { Stack } from '../ListView/ApplicationsStacksDatatable/types';

import { queryKeys } from './query-keys';

export function useDeleteApplicationsMutation({
  environmentId,
  stacks,
  reportStacks,
}: {
  environmentId: EnvironmentId;
  stacks: Stack[];
  reportStacks?: boolean;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applications: ApplicationRowData[]) =>
      deleteApplications(applications, stacks, environmentId),
    onSuccess: ({ settledAppDeletions, settledStackDeletions }) => {
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
      queryClient.invalidateQueries(queryKeys.applications(environmentId));
    },
    ...withGlobalError('Unable to remove applications'),
  });
}

async function deleteApplications(
  applications: ApplicationRowData[],
  stacks: Stack[],
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

  return { settledAppDeletions, settledStackDeletions };
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
