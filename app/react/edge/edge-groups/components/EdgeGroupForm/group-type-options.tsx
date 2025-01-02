import { List, Tag } from 'lucide-react';

import { BoxSelectorOption } from '@@/BoxSelector';

export const groupTypeOptions: ReadonlyArray<BoxSelectorOption<boolean>> = [
  {
    id: 'static-group',
    value: false,
    label: 'Static',
    description: 'Manually select Edge environments',
    icon: List,
    iconType: 'badge',
  },
  {
    id: 'dynamic-group',
    value: true,
    label: 'Dynamic',
    description: 'Automatically associate environments via tags',
    icon: Tag,
    iconType: 'badge',
  },
] as const;
