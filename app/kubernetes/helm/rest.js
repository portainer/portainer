import angular from 'angular';

angular.module('portainer.kubernetes').factory('HelmFactory', HelmFactory);

function HelmFactory($resource, API_ENDPOINT_ENDPOINTS) {
  const helmUrl = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/helm';
  const templatesUrl = '/api/templates/helm';

  return $resource(
    helmUrl,
    {},
    {
      templates: {
        url: templatesUrl,
        method: 'GET',
        params: { repo: '@repo' },
        cache: true,
      },
      show: {
        url: `${templatesUrl}/:type`,
        method: 'GET',
        params: { repo: '@repo', chart: '@chart' },
        transformResponse: function (data) {
          return { values: data };
        },
      },
      install: { method: 'POST' },
    }
  );
}
