export default class LdapCustomAdminGroupController {
  /* @ngInject */
  constructor($async, Notifications, LDAPService) {
    Object.assign(this, { $async, Notifications, LDAPService });

    this.groups = null;
    this.groupstest = null;
    this.enableAssignAdminGroup = false;

    this.onRemoveClick = this.onRemoveClick.bind(this);
    this.onAddClick = this.onAddClick.bind(this);
    this.search = this.search.bind(this);
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
        this.groups = await this.onSearchClick();
        this.enableAssignAdminGroup = this.groups && this.groups.length > 0;
      } catch (error) {
        this.Notifications.error('Failure', error, 'Failed to search groups');
      }
    });
  }

  async $onInit() {
    if (this.settings.AdminAutoPopulate && this.settings.AdminGroups && this.settings.AdminGroups.length > 0) {
      const settings = {
        ...this.settings,
        AdminGroupSearchSettings: this.settings.AdminGroupSearchSettings.map((search) => ({ ...search, GroupFilter: search.GroupFilter || this.defaultAdminGroupSearchFilter })),
      };

      this.groups = await this.LDAPService.adminGroups(settings);
    }

    if (this.groups && this.groups.length > 0) {
      this.enableAssignAdminGroup = true;
    }
  }
}
