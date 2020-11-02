/* @ngInject */
export function License($resource) {
  return $resource(
    `api/licenses/:action`,
    {},
    {
      query: { method: 'GET', isArray: true },
      attach: { method: 'POST' },
      remove: { method: 'POST', params: { action: 'remove' } },
      info: { method: 'get', params: { action: 'info' } },
    }
  );
}
