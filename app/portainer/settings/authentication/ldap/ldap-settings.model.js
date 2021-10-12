export function buildLdapSettingsModel() {
  return {
    AnonymousMode: true,
    ReaderDN: '',
    URLs: [''],
    ServerType: 0,
    TLSConfig: {
      TLS: false,
      TLSSkipVerify: false,
    },
    StartTLS: false,
    SearchSettings: [
      {
        BaseDN: '',
        Filter: '',
        UserNameAttribute: '',
      },
    ],
    GroupSearchSettings: [
      {
        GroupBaseDN: '',
        GroupFilter: '',
        GroupAttribute: '',
      },
    ],
    AdminGroupSearchSettings: [
      {
        GroupBaseDN: '',
        GroupFilter: '',
        GroupAttribute: '',
      },
    ],
    AutoCreateUsers: true,
  };
}

export function buildAdSettingsModel() {
  const settings = buildLdapSettingsModel();

  settings.ServerType = 2;
  settings.AnonymousMode = false;
  settings.SearchSettings[0].UserNameAttribute = 'sAMAccountName';
  settings.SearchSettings[0].Filter = '(objectClass=user)';
  settings.GroupSearchSettings[0].GroupAttribute = 'member';
  settings.GroupSearchSettings[0].GroupFilter = '(objectClass=group)';

  return settings;
}

export function buildOpenLDAPSettingsModel() {
  const settings = buildLdapSettingsModel();

  settings.ServerType = 1;
  settings.AnonymousMode = false;
  settings.SearchSettings[0].UserNameAttribute = 'uid';
  settings.SearchSettings[0].Filter = '(objectClass=inetOrgPerson)';
  settings.GroupSearchSettings[0].GroupAttribute = 'member';
  settings.GroupSearchSettings[0].GroupFilter = '(objectClass=groupOfNames)';

  return settings;
}
