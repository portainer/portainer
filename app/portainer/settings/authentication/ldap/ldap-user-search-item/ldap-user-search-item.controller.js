export default class LdapUserSearchItemController {
  /* @ngInject */
  constructor() {
    this.groups = [];

    this.onBaseDNChange = this.onBaseDNChange.bind(this);
    this.onGroupChange = this.onGroupChange.bind(this);
    this.onGroupsChange = this.onGroupsChange.bind(this);
    this.removeGroup = this.removeGroup.bind(this);
  }

  onBaseDNChange(baseDN) {
    this.config.BaseDN = baseDN;
  }

  onGroupChange(index, group) {
    this.groups[index] = group;
    this.onGroupsChange(this.groups);
  }

  onGroupsChange(groups) {
    this.config.Filter = this.generateUserFilter(groups);
  }

  removeGroup(index) {
    this.groups.splice(index, 1);
    this.onGroupsChange(this.groups);
  }

  addGroup() {
    this.groups.push(this.domainSuffix ? `cn=,${this.domainSuffix}` : 'cn=');
  }

  generateUserFilter(groups) {
    const filteredGroups = groups.filter((group) => group !== this.domainSuffix);

    if (!filteredGroups.length) {
      return this.baseFilter;
    }

    const groupsFilter = filteredGroups.map((group) => `(memberOf=${group})`);

    return `(&${this.baseFilter}${groupsFilter.length > 1 ? `(|${groupsFilter.join('')})` : groupsFilter[0]})`;
  }

  parseFilter() {
    const filter = this.config.Filter;
    if (filter === this.baseFilter) {
      return;
    }

    if (!filter.includes('|')) {
      const index = filter.indexOf('memberOf=');
      if (index > -1) {
        this.groups = [filter.slice(index + 9, -2)];
      }
      return;
    }

    const members = filter.slice(filter.indexOf('|') + 2, -3);
    this.groups = members.split(')(').map((member) => member.replace('memberOf=', ''));
  }

  $onInit() {
    this.parseFilter();
  }
}
