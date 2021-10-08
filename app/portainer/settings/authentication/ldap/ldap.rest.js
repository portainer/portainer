const API_ENDPOINT_LDAP = 'api/ldap';

/* @ngInject */
export function LDAP($resource) {
  return $resource(
    `${API_ENDPOINT_LDAP}/:action`,
    {},
    {
      check: { method: 'POST', params: { action: 'check' } },
      users: { method: 'POST', isArray: true, params: { action: 'users' } },
      groups: { method: 'POST', isArray: true, params: { action: 'groups' } },
      testLogin: { method: 'POST', params: { action: 'test' } },
    }
  );
}
