import { Eye, Moon, Sun, RefreshCw } from 'lucide-react';

import { BadgeIcon } from '@@/BadgeIcon';

export const options = [
  {
    id: 'light',
    icon: <BadgeIcon icon={Sun} />,
    label: 'Light Theme',
    value: 'light',
  },
  {
    id: 'dark',
    icon: <BadgeIcon icon={Moon} />,
    label: 'Dark Theme',
    value: 'dark',
  },
  {
    id: 'highcontrast',
    icon: <BadgeIcon icon={Eye} />,
    label: 'High Contrast',
    value: 'highcontrast',
  },
  {
    id: 'auto',
    icon: <BadgeIcon icon={RefreshCw} />,
    label: 'System Theme',
    value: 'auto',
  },
] as const;
