/* @ngInject */
export function LDAPService(LDAP) {
  return { users, groups, check, testLogin };

  function users(ldapSettings) {
    return LDAP.users({ ldapSettings }).$promise;
  }

  async function groups(ldapSettings) {
    const userGroups = await LDAP.groups({ ldapSettings }).$promise;
    return userGroups.map(({ Name, Groups }) => {
      let name = Name;
      if (Name.includes(',') && Name.includes('=')) {
        const [cnName] = Name.split(',');
        const split = cnName.split('=');
        name = split[1];
      }
      return { Groups, Name: name };
    });
  }

  function check(ldapSettings) {
    return LDAP.check({ ldapSettings }).$promise;
  }

  function testLogin(ldapSettings, username, password) {
    return LDAP.testLogin({ ldapSettings, username, password }).$promise;
  }
}
