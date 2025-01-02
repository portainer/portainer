import { baseHref } from '@/portainer/helpers/pathHelper';

/* @ngInject */
export function UserActivity($resource, $http) {
  const BASE_URL = baseHref() + 'api/useractivity';

  const resource = $resource(
    `${BASE_URL}/:action`,
    {},
    {
      authLogs: { method: 'GET', params: { action: 'authlogs' } },
    }
  );

  return { authLogsAsCSV, ...resource };

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
}
