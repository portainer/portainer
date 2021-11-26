import angular from 'angular';

angular.module('portainer.app').factory('OpenAMT', OpenAMTFactory);

/* @ngInject */
function OpenAMTFactory($resource) {
  return $resource(
    'api/open_amt/:endpointId/:action/:deviceId',
    {},
    {
      submit: {
        method: 'POST',
      },
      getDevices: {
        method: 'GET',
        params: {
          id: '@endpointId',
          action: 'devices',
        },
      },
      executeDeviceAction: {
        method: 'GET',
        params: {
          id: '@endpointId',
          action: '@action',
          deviceGUID: '@deviceId',
        },
      },
    }
  );
}
