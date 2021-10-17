/* @ngInject */
export function RolesFactory($resource, $browser, API_ENDPOINT_ROLES) {
  return $resource(
    `${$browser.baseHref()}${API_ENDPOINT_ROLES}/:id`,
    {},
    {
      create: { method: 'POST', ignoreLoadingBar: true },
      query: { method: 'GET', isArray: true },
      get: { method: 'GET', params: { id: '@id' } },
      update: { method: 'PUT', params: { id: '@id' } },
      remove: { method: 'DELETE', params: { id: '@id' } },
    }
  );
}
