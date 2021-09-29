import { EXTERNAL_AUTH_LDAP } from '@/portainer/feature-flags/feature-ids';

export default class LdapSettingsCustomController {
  constructor() {
    this.limitedFeature = EXTERNAL_AUTH_LDAP;
  }

  addLDAPUrl() {
    this.settings.URLs.push('');
  }

  removeLDAPUrl(index) {
    this.settings.URLs.splice(index, 1);
  }
}
