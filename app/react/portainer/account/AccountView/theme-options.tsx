import { Eye, Moon, Sun, RefreshCw } from 'lucide-react';
import i18n from '@/i18n';

import { BadgeIcon } from '@@/BadgeIcon';

export function getThemeOptions() {
  return [
    {
      id: 'light',
      icon: <BadgeIcon icon={Sun} />,
      label: i18n.t('theme.light'),
      value: 'light',
    },
    {
      id: 'dark',
      icon: <BadgeIcon icon={Moon} />,
      label: i18n.t('theme.dark'),
      value: 'dark',
    },
    {
      id: 'highcontrast',
      icon: <BadgeIcon icon={Eye} />,
      label: i18n.t('theme.high_contrast'),
      value: 'highcontrast',
    },
    {
      id: 'auto',
      icon: <BadgeIcon icon={RefreshCw} />,
      label: i18n.t('theme.auto'),
      value: 'auto',
    },
  ];
}

export const options = getThemeOptions();
