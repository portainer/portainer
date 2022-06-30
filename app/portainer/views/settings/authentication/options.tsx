import { FeatureId } from '@/portainer/feature-flags/enums';
import Microsoft from '@/assets/ico/microsoft.svg?c';
import Ldap from '@/assets/ico/ldap.svg?c';
import Oauth from '@/assets/ico/oauth.svg?c';

export const options = [
  {
    id: 'auth_internal',
    icon: 'user',
    featherIcon: true,
    label: 'Internal',
    description: 'Internal authentication mechanism',
    value: 1,
  },
  {
    id: 'auth_ldap',
    icon: Ldap,
    label: 'LDAP',
    description: 'LDAP authentication',
    value: 2,
  },
  {
    id: 'auth_ad',
    icon: Microsoft,
    label: 'Microsoft Active Directory',
    description: 'AD authentication',
    value: 4,
    feature: FeatureId.HIDE_INTERNAL_AUTH,
  },
  {
    id: 'auth_oauth',
    icon: Oauth,
    label: 'OAuth',
    description: 'OAuth authentication',
    value: 3,
  },
];
