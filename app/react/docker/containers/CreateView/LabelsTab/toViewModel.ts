import { ContainerJSON } from '../../queries/container';

import { Values } from './types';

export function toViewModel(config: ContainerJSON): Values {
  if (!config || !config.Config || !config.Config.Labels) {
    return [];
  }

  return Object.entries(config.Config.Labels).map(([name, value]) => ({
    name,
    value,
  }));
}

export function getDefaultViewModel(): Values {
  return [];
}
