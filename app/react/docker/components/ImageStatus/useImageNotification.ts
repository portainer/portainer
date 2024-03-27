import { useQuery } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios';
import { ServiceId } from '@/react/docker/services/types';
import { ContainerId } from '@/react/docker/containers/types';

import { ImageStatus, ResourceID, ResourceType } from './types';

export function useImageNotification(
  environmentId: number,
  resourceId: ResourceID,
  resourceType: ResourceType,
  nodeName: string,
  enabled = false
) {
  return useQuery(
    [
      'environments',
      environmentId,
      'docker',
      'images',
      resourceType,
      resourceId,
      'status',
    ],
    () =>
      resourceType === ResourceType.SERVICE
        ? getServiceImagesStatus(environmentId, resourceId)
        : getContainerImagesStatus(environmentId, resourceId, nodeName),
    {
      enabled,
    }
  );
}

async function getContainerImagesStatus(
  environmentId: EnvironmentId,
  containerID: ContainerId,
  nodeName: string
) {
  try {
    let headers = {};
    if (nodeName !== '') {
      headers = { 'X-PortainerAgent-Target': nodeName };
    }
    const { data } = await axios.get<ImageStatus>(
      `/docker/${environmentId}/containers/${containerID}/image_status`,
      { headers }
    );
    return data;
  } catch (e) {
    return {
      Status: 'unknown',
      Message: `Unable to retrieve image status for container: ${containerID}`,
    };
  }
}

async function getServiceImagesStatus(
  environmentId: EnvironmentId,
  serviceID: ServiceId
) {
  try {
    const { data } = await axios.get<ImageStatus>(
      `/docker/${environmentId}/services/${serviceID}/image_status`
    );
    return data;
  } catch (e) {
    return {
      Status: 'unknown',
      Message: `Unable to retrieve image status for service: ${serviceID}`,
    };
  }
}
