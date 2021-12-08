import angular from 'angular';

const API_ENDPOINT_FDO = 'api/fdo';

angular.module('portainer.app').factory('FDO', FDOFactory);

/* @ngInject */
function FDOFactory($resource) {
  return $resource(
    API_ENDPOINT_FDO + '/:action/:deviceId',
    {},
    {
      submit: { method: 'POST' },
      importDevice: { method: 'POST', params: { action: 'import', id: '@deviceId' } },
    }
  );
}
