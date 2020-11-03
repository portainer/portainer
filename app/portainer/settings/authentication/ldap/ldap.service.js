/* @ngInject */
export function LDAPService(LDAP) {
  return { users, groups, check, testLogin };

  function users(ldapSettings) {
    return LDAP.users({ ldapSettings }).$promise;
  }

  function groups(ldapSettings) {
    return LDAP.groups({ ldapSettings }).$promise;
  }

  function check(ldapSettings) {
    return LDAP.check({ ldapSettings }).$promise;
  }

  function testLogin(ldapSettings, username, password) {
    return LDAP.testLogin({ ldapSettings, username, password }).$promise;
  }
}
