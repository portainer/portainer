import angular from 'angular';

const API_ENDPOINT_HELMCHART = '/api/templates/helm';

angular.module('portainer.app').factory('HelmValues', HelmValuesFactory);

/* @ngInject */
function HelmValuesFactory($resource) {
  return $resource(
    API_ENDPOINT_HELMCHART + '/:chart/values',
    {},
    {
      get: { method: 'GET', cache: true },
    }
  );
}
