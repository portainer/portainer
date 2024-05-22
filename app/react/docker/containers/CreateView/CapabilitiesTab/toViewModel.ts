import { ContainerDetailsJSON } from '@/react/docker/containers/queries/useContainer';

import { capabilities } from './types';
import { Values } from './CapabilitiesTab';

export function toViewModel(config: ContainerDetailsJSON): Values {
  const { CapAdd, CapDrop } = getDefaults(config);

  const missingCaps = capabilities
    .filter(
      (cap) =>
        cap.default && !CapAdd.includes(cap.key) && !CapDrop.includes(cap.key)
    )
    .map((cap) => cap.key);

  return [...CapAdd, ...missingCaps];

  function getDefaults(config: ContainerDetailsJSON) {
    return {
      CapAdd: config.HostConfig?.CapAdd || [],
      CapDrop: config.HostConfig?.CapDrop || [],
    };
  }
}

export function getDefaultViewModel(): Values {
  return capabilities.filter((cap) => cap.default).map((cap) => cap.key);
}
