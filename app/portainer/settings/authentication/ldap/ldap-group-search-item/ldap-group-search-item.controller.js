export default class LdapSettingsAdGroupSearchItemController {
  /* @ngInject */
  constructor(Notifications) {
    Object.assign(this, { Notifications });

    this.groups = [];

    this.onChangeBaseDN = this.onChangeBaseDN.bind(this);
  }

  onChangeBaseDN(baseDN) {
    this.config.GroupBaseDN = baseDN;
  }

  addGroup() {
    this.groups.push({ type: 'ou', value: '' });
  }

  removeGroup($index) {
    this.groups.splice($index, 1);
    this.onGroupsChange();
  }

  onGroupsChange() {
    const groupsFilter = this.groups.map(({ type, value }) => `(${type}=${value})`).join('');
    this.onFilterChange(groupsFilter ? `(&${this.baseFilter}(|${groupsFilter}))` : `${this.baseFilter}`);
  }

  onFilterChange(filter) {
    this.config.GroupFilter = filter;
  }

  parseGroupFilter() {
    const match = this.config.GroupFilter.match(/^\(&\(objectClass=(\w+)\)\(\|((\(\w+=.+\))+)\)\)$/);
    if (!match) {
      return;
    }

    const [, , groupFilter = ''] = match;

    this.groups = groupFilter
      .slice(1, -1)
      .split(')(')
      .map((str) => str.split('='))
      .map(([type, value]) => ({ type, value }));
  }

  $onInit() {
    this.parseGroupFilter();
  }
}
