import { ArrowDownCircle } from 'lucide-react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import Microsoft from '@/assets/ico/vendor/microsoft.svg?c';
import Ldap from '@/assets/ico/ldap.svg?c';
import OAuth from '@/assets/ico/oauth.svg?c';

export const options = [
  {
    id: 'auth_internal',
    icon: ArrowDownCircle,
    iconType: 'badge',
    label: 'Internal',
    description: 'Internal authentication mechanism',
    value: 1,
  },
  {
    id: 'auth_ldap',
    icon: Ldap,
    label: 'LDAP',
    description: 'LDAP authentication',
    iconType: 'logo',
    value: 2,
  },
  {
    id: 'auth_ad',
    icon: Microsoft,
    label: 'Microsoft Active Directory',
    description: 'AD authentication',
    iconType: 'logo',
    value: 4,
    feature: FeatureId.HIDE_INTERNAL_AUTH,
  },
  {
    id: 'auth_oauth',
    icon: OAuth,
    label: 'OAuth',
    description: 'OAuth authentication',
    iconType: 'logo',
    value: 3,
  },
];
