import { Eye, Moon, Sun, RefreshCw } from 'lucide-react';

import { BadgeIcon } from '@@/BadgeIcon';

export const options = [
  {
    id: 'light',
    icon: <BadgeIcon icon={Sun} />,
    label: 'Light Theme',
    description: 'Default color mode',
    value: 'light',
  },
  {
    id: 'dark',
    icon: <BadgeIcon icon={Moon} />,
    label: 'Dark Theme',
    description: 'Dark color mode',
    value: 'dark',
  },
  {
    id: 'highcontrast',
    icon: <BadgeIcon icon={Eye} />,
    label: 'High Contrast',
    description: 'High contrast color mode',
    value: 'highcontrast',
  },
  {
    id: 'auto',
    icon: <BadgeIcon icon={RefreshCw} />,
    label: 'Auto',
    description: 'Sync with system theme',
    value: 'auto',
  },
];
