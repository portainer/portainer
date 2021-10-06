export default class LdapCustomGroupSearchController {
  /* @ngInject */
  constructor($async, Notifications) {
    Object.assign(this, { $async, Notifications });

    this.groups = null;
    this.showTable = false;

    this.onRemoveClick = this.onRemoveClick.bind(this);
    this.onAddClick = this.onAddClick.bind(this);
    this.search = this.search.bind(this);
  }

  onAddClick() {
    this.settings.push({ GroupBaseDN: '', GroupAttribute: '', GroupFilter: '' });
  }

  onRemoveClick(index) {
    this.settings.splice(index, 1);
  }

  search() {
    return this.$async(async () => {
      try {
        this.groups = null;
        this.showTable = true;
        this.groups = await this.onSearchClick();
      } catch (error) {
        this.showTable = false;
        this.Notifications.error('Failure', error, 'Failed to search users');
      }
    });
  }
}
