import { Sliders, AlignJustify } from 'lucide-react';

import { BoxSelector, BoxSelectorOption } from '@@/BoxSelector';

import { PlacementType } from './types';

type Props = {
  placementType: PlacementType;
  onChange: (placementType: PlacementType) => void;
};

export const placementOptions: ReadonlyArray<BoxSelectorOption<PlacementType>> =
  [
    {
      id: 'placement_hard',
      value: 'mandatory',
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
      value: 'preferred',
      icon: AlignJustify,
      iconType: 'badge',
      label: 'Preferred',
      description:
        'Schedule this application on nodes that match the rules if possible',
    },
  ] as const;

export function PlacementTypeBoxSelector({ placementType, onChange }: Props) {
  return (
    <BoxSelector<PlacementType>
      value={placementType}
      options={placementOptions}
      onChange={(placementType) => onChange(placementType)}
      radioName="placementType"
      slim
    />
  );
}
