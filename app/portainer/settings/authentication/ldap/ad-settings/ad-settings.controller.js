import _ from 'lodash-es';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

export default class AdSettingsController {
  /* @ngInject */
  constructor(LDAPService, $scope) {
    this.LDAPService = LDAPService;
    this.$scope = $scope;

    this.domainSuffix = '';
    this.limitedFeatureId = FeatureId.HIDE_INTERNAL_AUTH;
    this.onTlscaCertChange = this.onTlscaCertChange.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.searchGroups = this.searchGroups.bind(this);
    this.parseDomainName = this.parseDomainName.bind(this);
    this.onAccountChange = this.onAccountChange.bind(this);
    this.onAutoUserProvisionChange = this.onAutoUserProvisionChange.bind(this);
    this.onAutoUserProvisionChange = this.onAutoUserProvisionChange.bind(this);
  }

  onAutoUserProvisionChange(value) {
    this.$scope.$evalAsync(() => {
      this.settings.AutoCreateUsers = value;
    });
  }

  parseDomainName(account) {
    this.domainName = '';

    if (!account) {
      return;
    }

    // Service account entered as a distinguished name (e.g. cn=reader,dc=portainer,dc=io)
    if (!account.includes('@')) {
      this.domainSuffix = account
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.toLowerCase().startsWith('dc='))
        .join(',');
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

  isSaveSettingButtonDisabled() {
    return isLimitedToBE(this.limitedFeatureId) || !this.isLdapFormValid();
  }

  $onInit() {
    this.tlscaCert = this.settings.TLSCACert;
    this.parseDomainName(this.settings.ReaderDN);
  }
}
