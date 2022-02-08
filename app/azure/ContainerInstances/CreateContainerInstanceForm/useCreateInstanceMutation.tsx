import { useMutation, useQueryClient } from 'react-query';

import { createContainerGroup } from '@/azure/services/container-groups.service';
import { EnvironmentId } from '@/portainer/environments/types';
import PortainerError from '@/portainer/error';
import {
  ContainerGroup,
  ContainerInstanceFormValues,
  ResourceGroup,
} from '@/azure/types';
import { UserId } from '@/portainer/users/types';
import { applyResourceControl } from '@/portainer/resource-control/resource-control.service';

import { getSubscriptionResourceGroups } from './utils';

export function useCreateInstance(
  resourceGroups: {
    [k: string]: ResourceGroup[];
  },
  environmentId: EnvironmentId,
  userId?: UserId
) {
  const queryClient = useQueryClient();
  return useMutation<ContainerGroup, unknown, ContainerInstanceFormValues>(
    (values) => {
      if (!values.subscription) {
        throw new PortainerError('subscription is required');
      }

      const subscriptionResourceGroup = getSubscriptionResourceGroups(
        values.subscription,
        resourceGroups
      );
      const resourceGroup = subscriptionResourceGroup.find(
        (r) => r.value === values.resourceGroup
      );
      if (!resourceGroup) {
        throw new PortainerError('resource group not found');
      }

      return createContainerGroup(
        values,
        environmentId,
        values.subscription,
        resourceGroup.label
      );
    },
    {
      async onSuccess(containerGroup, values) {
        if (!userId) {
          throw new Error('missing user id');
        }

        const resourceControl = containerGroup.Portainer.ResourceControl;
        const accessControlData = values.accessControl;
        await applyResourceControl(userId, accessControlData, resourceControl);
        queryClient.invalidateQueries(['azure', 'container-instances']);
      },
    }
  );
}
