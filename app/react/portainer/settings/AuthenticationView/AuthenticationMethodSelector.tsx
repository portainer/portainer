import { ArrowDownCircle } from 'lucide-react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import Microsoft from '@/assets/ico/vendor/microsoft.svg?c';
import Ldap from '@/assets/ico/ldap.svg?c';
import OAuth from '@/assets/ico/oauth.svg?c';

import { BoxSelector } from '@@/BoxSelector';

import { AuthenticationMethod } from '../types';

const options = [
  {
    id: 'auth_internal',
    icon: ArrowDownCircle,
    iconType: 'badge',
    label: 'Internal',
    description: 'Internal authentication mechanism',
    value: AuthenticationMethod.Internal,
  },
  {
    id: 'auth_ldap',
    icon: Ldap,
    label: 'LDAP',
    description: 'LDAP authentication',
    iconType: 'logo',
    value: AuthenticationMethod.LDAP,
  },
  {
    id: 'auth_ad',
    icon: Microsoft,
    label: 'Microsoft Active Directory',
    description: 'AD authentication',
    iconType: 'logo',
    value: AuthenticationMethod.AD,
    feature: FeatureId.HIDE_INTERNAL_AUTH,
  },
  {
    id: 'auth_oauth',
    icon: OAuth,
    label: 'OAuth',
    description: 'OAuth authentication',
    iconType: 'logo',
    value: AuthenticationMethod.OAuth,
  },
] as const;

export function AuthenticationMethodSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <BoxSelector
      radioName="authOptions"
      options={options}
      value={value}
      onChange={onChange}
      label="Authentication method"
    />
  );
}
