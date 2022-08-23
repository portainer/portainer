import { Edit } from 'react-feather';

import { FeatureId } from '@/portainer/feature-flags/enums';
import Microsoft from '@/assets/ico/vendor/microsoft.svg?c';
import Google from '@/assets/ico/vendor/google.svg?c';
import Github from '@/assets/ico/vendor/github.svg?c';

import { BadgeIcon } from '@@/BoxSelector/BadgeIcon';

export const options = [
  {
    id: 'microsoft',
    icon: Microsoft,
    featherIcon: true,
    label: 'Microsoft',
    description: 'Microsoft OAuth provider',
    value: 'microsoft',
    feature: FeatureId.HIDE_INTERNAL_AUTH,
  },
  {
    id: 'google',
    icon: Google,
    label: 'Google',
    description: 'Google OAuth provider',
    value: 'google',
    feature: FeatureId.HIDE_INTERNAL_AUTH,
  },
  {
    id: 'github',
    icon: Github,
    label: 'Github',
    description: 'Github OAuth provider',
    value: 'github',
    feature: FeatureId.HIDE_INTERNAL_AUTH,
  },
  {
    id: 'custom',
    icon: <BadgeIcon icon={Edit} />,
    label: 'Custom',
    description: 'Custom OAuth provider',
    value: 'custom',
  },
];
