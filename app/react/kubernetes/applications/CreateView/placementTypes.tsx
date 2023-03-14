import { AlignJustify, Sliders } from 'lucide-react';

import { KubernetesApplicationPlacementTypes } from '@/kubernetes/models/application/models';

import { BoxSelectorOption } from '@@/BoxSelector';

export const placementOptions: ReadonlyArray<BoxSelectorOption<number>> = [
  {
    id: 'placement_hard',
    value: KubernetesApplicationPlacementTypes.MANDATORY,
    icon: Sliders,
    iconType: 'badge',
    label: 'Mandatory',
    description: (
      <>
        Schedule this application <b>ONLY</b> on nodes that match <b>ALL</b>{' '}
        Rules
      </>
    ),
  },
  {
    id: 'placement_soft',
    value: KubernetesApplicationPlacementTypes.PREFERRED,
    icon: AlignJustify,
    iconType: 'badge',
    label: 'Preferred',
    description:
      'Schedule this application on nodes that match the rules if possible',
  },
] as const;
