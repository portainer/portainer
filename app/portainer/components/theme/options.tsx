import Lightmode from '@/assets/ico/theme/lightmode.svg?c';
import Darkmode from '@/assets/ico/theme/darkmode.svg?c';
import Highcontrastmode from '@/assets/ico/theme/highcontrastmode.svg?c';
import Automode from '@/assets/ico/theme/auto.svg?c';

export const options = [
  {
    id: 'light',
    icon: Lightmode,
    label: 'Light Theme',
    description: 'Default color mode',
    value: 'light',
  },
  {
    id: 'dark',
    icon: Darkmode,
    label: 'Dark Theme',
    description: 'Dark color mode',
    value: 'dark',
  },
  {
    id: 'highcontrast',
    icon: Highcontrastmode,
    label: 'High Contrast',
    description: 'High contrast color mode',
    value: 'highcontrast',
  },
  {
    id: 'auto',
    icon: Automode,
    label: 'Auto',
    description: 'Sync with system theme',
    value: 'auto',
  },
];
