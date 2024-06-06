import { Tag } from 'lucide-react';

import { BoxSelectorOption } from '@@/BoxSelector';

export const tagOptions: ReadonlyArray<BoxSelectorOption<boolean>> = [
  {
    id: 'or-selector',
    value: true,
    label: 'Partial Match',
    description:
      'Associate any environment matching at least one of the selected tags',
    icon: Tag,
    iconType: 'badge',
  },
  {
    id: 'and-selector',
    value: false,
    label: 'Full Match',
    description: 'Associate any environment matching all of the selected tags',
    icon: Tag,
    iconType: 'badge',
  },
];
