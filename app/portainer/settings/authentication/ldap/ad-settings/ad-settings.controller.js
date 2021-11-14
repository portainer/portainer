import _ from 'lodash-es';

import { FeatureId } from '@/portainer/feature-flags/enums';

export default class AdSettingsController {
  /* @ngInject */
  constructor(LDAPService) {
    this.LDAPService = LDAPService;

    this.domainSuffix = '';
    this.limitedFeatureId = FeatureId.HIDE_INTERNAL_AUTH;
    this.onTlscaCertChange = this.onTlscaCertChange.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.searchGroups = this.searchGroups.bind(this);
    this.parseDomainName = this.parseDomainName.bind(this);
    this.onAccountChange = this.onAccountChange.bind(this);
  }

  parseDomainName(account) {
    this.domainName = '';

    if (!account || !account.includes('@')) {
      return;
    }

    const [, domainName] = account.split('@');
    if (!domainName) {
      return;
    }

    const parts = _.compact(domainName.split('.'));
    this.domainSuffix = parts.map((part) => `dc=${part}`).join(',');
  }

  onAccountChange(account) {
    this.parseDomainName(account);
  }

  searchUsers() {
    return this.LDAPService.users(this.settings);
  }

  searchGroups() {
    return this.LDAPService.groups(this.settings);
  }

  onTlscaCertChange(file) {
    this.tlscaCert = file;
  }

  addLDAPUrl() {
    this.settings.URLs.push('');
  }

  removeLDAPUrl(index) {
    this.settings.URLs.splice(index, 1);
  }

  $onInit() {
    this.tlscaCert = this.settings.TLSCACert;
    this.parseDomainName(this.settings.ReaderDN);
  }
}
