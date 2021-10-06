import _ from 'lodash-es';

export default class LdapGroupSearchController {
  /* @ngInject */
  constructor($async, Notifications) {
    Object.assign(this, { $async, Notifications });

    this.groups = null;

    this.onRemoveClick = this.onRemoveClick.bind(this);
    this.onAddClick = this.onAddClick.bind(this);
    this.search = this.search.bind(this);
  }

  onAddClick() {
    const lastSetting = _.last(this.settings);
    this.settings.push({ GroupBaseDN: this.domainSuffix, GroupAttribute: lastSetting.GroupAttribute, GroupFilter: this.baseFilter });
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
