import { EnvironmentId } from '@/react/portainer/environments/types';
import axios from '@/portainer/services/axios';
import { ServiceId } from '@/react/docker/services/types';

import { ContainerId } from '../containers/types';

import { ImageStatus } from './types';

export async function getContainerImagesStatus(
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

export async function getServiceImagesStatus(
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
