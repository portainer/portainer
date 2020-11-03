import _ from 'lodash';

export default class LdapUserSearchController {
  /* @ngInject */
  constructor($async, Notifications) {
    Object.assign(this, { $async, Notifications });

    this.users = null;
    this.showTable = false;

    this.onRemoveClick = this.onRemoveClick.bind(this);
    this.onAddClick = this.onAddClick.bind(this);
    this.search = this.search.bind(this);
  }

  onAddClick() {
    const lastSetting = _.last(this.settings);
    this.settings.push({ BaseDN: this.domainSuffix, UserNameAttribute: lastSetting.UserNameAttribute, Filter: this.baseFilter });
  }

  onRemoveClick(index) {
    this.settings.splice(index, 1);
  }

  search() {
    return this.$async(async () => {
      try {
        this.users = null;
        this.showTable = true;
        const users = await this.onSearchClick();
        this.users = _.compact(users);
      } catch (error) {
        this.Notifications.error('Failure', error, 'Failed to search users');
        this.showTable = false;
      }
    });
  }
}
