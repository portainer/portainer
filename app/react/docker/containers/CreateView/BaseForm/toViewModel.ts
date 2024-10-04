import { parseAccessControlFormData } from '@/react/portainer/access-control/utils';
import { ResourceControlOwnership } from '@/react/portainer/access-control/types';
import { UserId } from '@/portainer/users/types';
import { getDefaultImageConfig } from '@/react/portainer/registries/utils/getImageConfig';

import { ContainerDetailsResponse } from '../../queries/useContainer';

import { toViewModel as toPortsMappingViewModel } from './PortsMappingField.viewModel';
import { Values } from './BaseForm';

export function toViewModel(
  config: ContainerDetailsResponse,
  isPureAdmin: boolean,
  currentUserId: UserId,
  nodeName: string,
  image: Values['image'],
  enableWebhook: boolean
): Values {
  // accessControl shouldn't be copied to new container

  const accessControl = parseAccessControlFormData(isPureAdmin, currentUserId);

  if (config.Portainer?.ResourceControl?.Public) {
    accessControl.ownership = ResourceControlOwnership.PUBLIC;
  }

  return {
    accessControl,
    name: config.Name ? config.Name.replace('/', '') : '',
    alwaysPull: true,
    autoRemove: config.HostConfig?.AutoRemove || false,
    ports: toPortsMappingViewModel(config.HostConfig?.PortBindings || {}),
    publishAllPorts: config.HostConfig?.PublishAllPorts || false,
    nodeName,
    image,
    enableWebhook,
  };
}

export function getDefaultViewModel(
  isPureAdmin: boolean,
  currentUserId: UserId,
  nodeName: string
): Values {
  const accessControl = parseAccessControlFormData(isPureAdmin, currentUserId);

  return {
    nodeName,
    enableWebhook: false,
    image: getDefaultImageConfig(),
    accessControl,
    name: '',
    alwaysPull: true,
    autoRemove: false,
    ports: [],
    publishAllPorts: false,
  };
}
