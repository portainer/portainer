function LDAPSettingsViewModel(data) {
  this.ReaderDN = data.ReaderDN;
  this.Password = data.Password;
  this.URL = data.URL;
  this.SearchSettings = data.SearchSettings;
  this.GroupSearchSettings = data.GroupSearchSettings;
}

function LDAPSearchSettings(BaseDN, UsernameAttribute, Filter) {
  this.BaseDN = BaseDN;
  this.UsernameAttribute = UsernameAttribute;
  this.Filter = Filter;
}

function LDAPGroupSearchSettings(GroupBaseDN, GroupAttribute, GroupFilter) {
  this.GroupBaseDN = GroupBaseDN;
  this.GroupAttribute = GroupAttribute;
  this.GroupFilter = GroupFilter;
}
