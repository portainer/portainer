import { EXTERNAL_AUTH_LDAP } from '@/portainer/feature-flags/feature-ids';
import _ from 'lodash-es';

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

  isLDAPFormValid() {
    const ldapSettings = this.settings;
    const isTLSMode = ldapSettings.TLSConfig.TLS || ldapSettings.StartTLS;

    return (
      _.compact(ldapSettings.URLs).length &&
      (ldapSettings.AnonymousMode || (ldapSettings.ReaderDN && ldapSettings.Password)) &&
      (!isTLSMode || this.TLSCACert || ldapSettings.TLSConfig.TLSSkipVerify)
    );
  }
}
