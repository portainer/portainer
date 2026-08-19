import { Edit } from 'lucide-react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import Microsoft from '@/assets/ico/vendor/microsoft.svg?c';
import Google from '@/assets/ico/vendor/google.svg?c';
import Github from '@/assets/ico/vendor/github.svg?c';

export const options = [
  {
    id: 'microsoft',
    icon: Microsoft,
    label: 'Microsoft',
    description: 'Microsoft OAuth provider',
    value: 'microsoft',
    iconType: 'logo',
    feature: FeatureId.HIDE_INTERNAL_AUTH,
  },
  {
    id: 'google',
    icon: Google,
    label: 'Google',
    description: 'Google OAuth provider',
    value: 'google',
    iconType: 'logo',
    feature: FeatureId.HIDE_INTERNAL_AUTH,
  },
  {
    id: 'github',
    icon: Github,
    label: 'Github',
    description: 'Github OAuth provider',
    value: 'github',
    iconType: 'logo',
    feature: FeatureId.HIDE_INTERNAL_AUTH,
  },
  {
    id: 'custom',
    icon: Edit,
    iconType: 'badge',
    label: 'Custom',
    description: 'Custom OAuth provider',
    value: 'custom',
  },
];
