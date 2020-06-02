angular.module('portainer.edge').factory('EdgeJobTasks', EdgeJobTasksFactory);

function EdgeJobTasksFactory($resource, API_ENDPOINT_EDGE_JOBS) {
  return $resource(
    API_ENDPOINT_EDGE_JOBS + '/:id/tasks/:taskId/:action',
    {},
    {
      logFile: { method: 'GET', params: { id: '@id', taskId: '@taskId', action: 'logs' } },
      clearLogs: { method: 'DELETE', params: { id: '@id', taskId: '@taskId', action: 'logs' } },
      collectLogs: { method: 'POST', params: { id: '@id', taskId: '@taskId', action: 'logs' } },
    }
  );
}
