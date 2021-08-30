import angular from 'angular';

angular.module('portainer.kubernetes').factory('HelmFactory', HelmFactory);

function HelmFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  const helmUrl = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/helm';
  const templatesUrl = '/api/templates/helm';

  return $resource(
    helmUrl,
    {
      endpointId: EndpointProvider.endpointID,
    },
    {
      templates: {
        url: templatesUrl,
        method: 'GET',
        cache: true,
      },
      show: {
        url: `${templatesUrl}/:chart/:type`,
        method: 'GET',
        transformResponse: function (data) {
          return { values: data };
        },
      },
      list: {
        method: 'GET',
        isArray: true,
      },
      install: { method: 'POST' },
      uninstall: {
        url: `${helmUrl}/:release`,
        method: 'DELETE',
      },
    }
  );
}
