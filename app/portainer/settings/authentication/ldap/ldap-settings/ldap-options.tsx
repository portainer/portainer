import { FeatureId } from '@/portainer/feature-flags/enums';
import Openldap from '@/assets/ico/vendor/openldap.svg?c';
import Custom from '@/assets/ico/custom.svg?c';

const SERVER_TYPES = {
  CUSTOM: 0,
  OPEN_LDAP: 1,
  AD: 2,
};

export const options = [
  {
    id: 'ldap_custom',
    icon: Custom,
    label: 'Custom',
    value: SERVER_TYPES.CUSTOM,
  },
  {
    id: 'ldap_openldap',
    icon: Openldap,
    label: 'OpenLDAP',
    value: SERVER_TYPES.OPEN_LDAP,
    feature: FeatureId.EXTERNAL_AUTH_LDAP,
  },
];
