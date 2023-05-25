import { Calendar, Edit } from 'lucide-react';

import { BoxSelectorOption } from '@@/BoxSelector';

export const cronMethodOptions: ReadonlyArray<BoxSelectorOption<string>> = [
  {
    id: 'config_basic',
    value: 'basic',
    icon: Calendar,
    iconType: 'badge',
    label: 'Basic configuration',
    description: 'Select date from calendar',
  },
  {
    id: 'config_advanced',
    value: 'advanced',
    icon: Edit,
    iconType: 'badge',
    label: 'Advanced configuration',
    description: 'Write your own cron rule',
  },
] as const;
