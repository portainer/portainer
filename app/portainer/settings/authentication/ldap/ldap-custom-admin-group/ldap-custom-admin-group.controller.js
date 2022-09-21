export default class LdapCustomAdminGroupController {
  /* @ngInject */
  constructor($async, $scope, Notifications, LDAPService) {
    Object.assign(this, { $async, $scope, Notifications, LDAPService });

    this.groups = null;
    this.groupstest = null;
    this.enableAssignAdminGroup = false;

    this.onRemoveClick = this.onRemoveClick.bind(this);
    this.onAddClick = this.onAddClick.bind(this);
    this.search = this.search.bind(this);
    this.onAdminGroupChange = this.onAdminGroupChange.bind(this);
  }

  onAddClick() {
    this.settings.AdminGroupSearchSettings.push({ GroupBaseDN: '', GroupAttribute: '', GroupFilter: '' });
  }

  onRemoveClick(index) {
    this.settings.AdminGroupSearchSettings.splice(index, 1);
  }

  search() {
    return this.$async(async () => {
      try {
        this.groups = null;
        const groups = await this.onSearchClick();
        this.groups = groups.map((group) => ({ label: group.name, value: group.name }));
        this.enableAssignAdminGroup = this.groups && this.groups.length > 0;
      } catch (error) {
        this.Notifications.error('Failure', error, 'Failed to search groups');
      }
    });
  }

  onAdminGroupChange(value) {
    return this.$scope.$evalAsync(() => {
      this.selectedAdminGroups = value;
    });
  }

  async $onInit() {
    if (this.settings.AdminAutoPopulate && this.settings.AdminGroups && this.settings.AdminGroups.length > 0) {
      await this.search();
    }

    if (this.groups && this.groups.length > 0) {
      this.enableAssignAdminGroup = true;
    }
  }
}
