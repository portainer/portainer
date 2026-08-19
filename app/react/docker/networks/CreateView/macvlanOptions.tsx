import { Share2, Sliders } from 'lucide-react';

import { BoxSelectorOption } from '@@/BoxSelector';

export function getOptions(
  hasNetworks: boolean
): ReadonlyArray<BoxSelectorOption<string>> {
  return [
    {
      id: 'network_config',
      icon: Sliders,
      iconType: 'badge',
      label: 'Configuration',
      description: 'I want to configure a network before deploying it',
      value: 'local',
    },
    {
      id: 'network_deploy',
      icon: Share2,
      iconType: 'badge',
      label: 'Creation',
      description: 'I want to create a network from a configuration',
      value: 'swarm',
      disabled: () => !hasNetworks,
    },
  ] as const;
}
