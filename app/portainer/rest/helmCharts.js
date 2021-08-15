import angular from 'angular';

const API_ENDPOINT_HELMCHART = '/api/templates/helm';

angular.module('portainer.app').factory('HelmCharts', HelmChartsFactory);

/* @ngInject */
function HelmChartsFactory($resource) {
  return $resource(
    API_ENDPOINT_HELMCHART,
    {},
    {
      get: { method: 'GET', cache: true },
    }
  );
}
