angular.module('portainer.edge').factory('EdgeJobs', EdgeJobsFactory);

function EdgeJobsFactory($resource, $browser, API_ENDPOINT_EDGE_JOBS) {
  return $resource(
    `${$browser.baseHref()}${API_ENDPOINT_EDGE_JOBS}/:id/:action`,
    {},
    {
      create: { method: 'POST' },
      query: { method: 'GET', isArray: true },
      get: { method: 'GET', params: { id: '@id' } },
      update: { method: 'PUT', params: { id: '@id' } },
      remove: { method: 'DELETE', params: { id: '@id' } },
      file: { method: 'GET', params: { id: '@id', action: 'file' } },
      tasks: { method: 'GET', isArray: true, params: { id: '@id', action: 'tasks' } },
    }
  );
}
