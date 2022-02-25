import { FeatureId } from '@/portainer/feature-flags/enums';

export default class LdapSettingsOpenLDAPController {
  /* @ngInject */
  constructor() {
    this.domainSuffix = '';
    this.limitedFeatureId = FeatureId.EXTERNAL_AUTH_LDAP;

    this.findDomainSuffix = this.findDomainSuffix.bind(this);
    this.parseDomainSuffix = this.parseDomainSuffix.bind(this);
    this.onAccountChange = this.onAccountChange.bind(this);
  }

  findDomainSuffix() {
    const serviceAccount = this.settings.ReaderDN;
    let domainSuffix = this.parseDomainSuffix(serviceAccount);
    if (!domainSuffix && this.settings.SearchSettings.length > 0) {
      const searchSettings = this.settings.SearchSettings[0];
      domainSuffix = this.parseDomainSuffix(searchSettings.BaseDN);
    }

    this.domainSuffix = domainSuffix;
  }

  parseDomainSuffix(string = '') {
    const index = string.toLowerCase().indexOf('dc=');
    return index !== -1 ? string.substring(index) : '';
  }

  onAccountChange(serviceAccount) {
    this.domainSuffix = this.parseDomainSuffix(serviceAccount);
  }

  addLDAPUrl() {
    this.settings.URLs.push('');
  }

  removeLDAPUrl(index) {
    this.settings.URLs.splice(index, 1);
  }

  $onInit() {
    this.findDomainSuffix();
  }
}
