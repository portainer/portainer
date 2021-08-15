import angular from 'angular';

angular.module('portainer.app').factory('HelmInstall', HelmInstallFactory);

/* @ngInject */
function HelmInstallFactory($resource, API_ENDPOINT_ENDPOINTS) {
  return $resource(
    API_ENDPOINT_ENDPOINTS + '/:id/kubernetes/helm',
    {},
    {
      install: { method: 'POST' },
    }
  );
}
