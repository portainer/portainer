import { ContainerDetailsJSON } from '../../queries/useContainer';

import { VolumeType, Values } from './types';

export function toViewModel(config: ContainerDetailsJSON): Values {
  return Object.values(config.Mounts || {}).map((mount) => ({
    type: (mount.Type || 'volume') as VolumeType,
    name: mount.Name || mount.Source || '',
    containerPath: mount.Destination || '',
    readOnly: mount.RW === false,
  }));
}

export function getDefaultViewModel(): Values {
  return [];
}
