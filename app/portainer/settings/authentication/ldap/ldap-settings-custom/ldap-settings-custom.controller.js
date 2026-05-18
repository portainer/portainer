import { FeatureId } from '@/react/portainer/feature-flags/enums';

export default class LdapSettingsCustomController {
  /* @ngInject */
  constructor($scope) {
    this.$scope = $scope;
    this.limitedFeatureId = FeatureId.EXTERNAL_AUTH_LDAP;

    this.onAdminGroupSearchSettingsChange = this.onAdminGroupSearchSettingsChange.bind(this);
    this.onAutoPopulateChange = this.onAutoPopulateChange.bind(this);
    this.onSelectedAdminGroupsChange = this.onSelectedAdminGroupsChange.bind(this);
  }

  addLDAPUrl() {
    this.settings.URLs.push('');
  }

  removeLDAPUrl(index) {
    this.settings.URLs.splice(index, 1);
  }

  onAdminGroupSearchSettingsChange(settings) {
    this.$scope.$evalAsync(() => {
      this.settings.AdminGroupSearchSettings = settings;
    });
  }

  onAutoPopulateChange(value) {
    this.$scope.$evalAsync(() => {
      this.settings.AdminAutoPopulate = value;
    });
  }

  onSelectedAdminGroupsChange(groups) {
    this.$scope.$evalAsync(() => {
      this.selectedAdminGroups = groups;
    });
  }
}
