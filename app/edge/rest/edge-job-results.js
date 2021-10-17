angular.module('portainer.edge').factory('EdgeJobResults', EdgeJobResultsFactory);

function EdgeJobResultsFactory($resource, $browser, API_ENDPOINT_EDGE_JOBS) {
  return $resource(
    `${$browser.baseHref()}${API_ENDPOINT_EDGE_JOBS}/:id/tasks/:taskId/:action`,
    {},
    {
      query: { method: 'GET', isArray: true, params: { id: '@id' } },
      logFile: { method: 'GET', params: { id: '@id', taskId: '@taskId', action: 'logs' } },
      clearLogs: { method: 'DELETE', params: { id: '@id', taskId: '@taskId', action: 'logs' } },
      collectLogs: { method: 'POST', params: { id: '@id', taskId: '@taskId', action: 'logs' } },
    }
  );
}
