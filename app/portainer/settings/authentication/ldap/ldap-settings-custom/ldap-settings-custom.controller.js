import { EXTERNAL_AUTH_LDAP } from '@/portainer/feature-flags/feature-ids';

export default class LdapSettingsCustomController {
  constructor() {
    this.limitedFeatureId = EXTERNAL_AUTH_LDAP;
  }

  addLDAPUrl() {
    this.settings.URLs.push('');
  }

  removeLDAPUrl(index) {
    this.settings.URLs.splice(index, 1);
  }
}
