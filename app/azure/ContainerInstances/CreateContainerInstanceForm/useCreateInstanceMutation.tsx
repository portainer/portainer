import { useMutation, useQueryClient } from 'react-query';

import { createContainerGroup } from '@/azure/services/container-groups.service';
import { EnvironmentId } from '@/portainer/environments/types';
import PortainerError from '@/portainer/error';
import {
  ContainerGroup,
  ContainerInstanceFormValues,
  ResourceGroup,
} from '@/azure/types';
import { applyResourceControl } from '@/portainer/access-control/access-control.service';

import { getSubscriptionResourceGroups } from './utils';

export function useCreateInstance(
  resourceGroups: {
    [k: string]: ResourceGroup[];
  },
  environmentId: EnvironmentId
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
        const resourceControl = containerGroup.Portainer?.ResourceControl;
        if (!resourceControl) {
          throw new PortainerError('resource control expected after creation');
        }

        const accessControlData = values.accessControl;
        await applyResourceControl(accessControlData, resourceControl);
        return queryClient.invalidateQueries(['azure', 'container-instances']);
      },
    }
  );
}
