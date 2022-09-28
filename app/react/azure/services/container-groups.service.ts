import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildContainerGroupUrl } from '../queries/utils';
import { ContainerGroup, ContainerInstanceFormValues } from '../types';

export async function createContainerGroup(
  model: ContainerInstanceFormValues,
  environmentId: EnvironmentId,
  subscriptionId: string,
  resourceGroupName: string
) {
  const payload = transformToPayload(model);
  try {
    const { data } = await axios.put<ContainerGroup>(
      buildContainerGroupUrl(
        environmentId,
        subscriptionId,
        resourceGroupName,
        model.name
      ),
      payload,
      { params: { 'api-version': '2018-04-01' } }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

export async function deleteContainerGroup(
  environmentId: EnvironmentId,
  containerGroupId: string
) {
  try {
    await axios.delete(`/endpoints/${environmentId}/azure${containerGroupId}`, {
      params: { 'api-version': '2018-04-01' },
    });
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to remove container group');
  }
}

function transformToPayload(model: ContainerInstanceFormValues) {
  const containerPorts = [];
  const addressPorts = [];

  const ports = model.ports.filter((p) => p.container && p.host);

  for (let i = 0; i < ports.length; i += 1) {
    const binding = ports[i];

    containerPorts.push({
      port: binding.container,
    });

    addressPorts.push({
      port: binding.host,
      protocol: binding.protocol,
    });
  }

  return {
    location: model.location,
    properties: {
      osType: model.os,
      containers: [
        {
          name: model.name,
          properties: {
            image: model.image,
            ports: containerPorts,
            resources: {
              requests: {
                cpu: model.cpu,
                memoryInGB: model.memory,
              },
            },
          },
        },
      ],
      ipAddress: {
        type: model.allocatePublicIP ? 'Public' : 'Private',
        ports: addressPorts,
      },
    },
  };
}
