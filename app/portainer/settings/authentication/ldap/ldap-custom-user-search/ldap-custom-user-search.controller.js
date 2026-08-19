export default class LdapCustomUserSearchController {
  /* @ngInject */
  constructor($async, Notifications) {
    Object.assign(this, { $async, Notifications });

    this.users = null;

    this.onRemoveClick = this.onRemoveClick.bind(this);
    this.onAddClick = this.onAddClick.bind(this);
    this.search = this.search.bind(this);
  }

  onAddClick() {
    this.settings.push({ BaseDN: '', UserNameAttribute: '', Filter: '' });
  }

  onRemoveClick(index) {
    this.settings.splice(index, 1);
  }

  search() {
    return this.$async(async () => {
      try {
        this.users = null;
        this.showTable = true;
        this.users = await this.onSearchClick();
      } catch (error) {
        this.showTable = false;
        this.Notifications.error('Failure', error, 'Failed to search users');
      }
    });
  }
}
