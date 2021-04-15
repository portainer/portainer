/* @ngInject */
export function UserActivity($resource, $http) {
  const BASE_URL = '/api/useractivity';

  const resource = $resource(
    `${BASE_URL}/:action`,
    {},
    {
      authLogs: { method: 'GET', params: { action: 'authlogs' } },
      logs: { method: 'GET', params: { action: 'logs' } },
    }
  );

  return { authLogsAsCSV, logsAsCSV, ...resource };

  async function authLogsAsCSV(params) {
    return $http({
      method: 'GET',
      url: `${BASE_URL}/authlogs.csv`,
      params,
      responseType: 'blob',
      headers: {
        'Content-type': 'text/csv',
      },
    });
  }

  async function logsAsCSV(params) {
    return $http({
      method: 'GET',
      url: `${BASE_URL}/logs.csv`,
      params,
      responseType: 'blob',
      headers: {
        'Content-type': 'text/csv',
      },
    });
  }
}
