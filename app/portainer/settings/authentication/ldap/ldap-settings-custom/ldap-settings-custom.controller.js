import { FeatureId } from '@/portainer/feature-flags/enums';

export default class LdapSettingsCustomController {
  constructor() {
    this.limitedFeatureId = FeatureId.EXTERNAL_AUTH_LDAP;
  }

  addLDAPUrl() {
    this.settings.URLs.push('');
  }

  removeLDAPUrl(index) {
    this.settings.URLs.splice(index, 1);
  }
}
