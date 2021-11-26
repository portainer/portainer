import angular from 'angular';

angular.module('portainer.app').factory('OpenAMT', OpenAMTFactory);

/* @ngInject */
function OpenAMTFactory($resource) {
  return $resource(
    'api/open_amt/:endpointId/:action/:deviceId/:deviceAction',
    {},
    {
      submit: {
        method: 'POST',
      },
      getDevices: {
        method: 'GET',
        params: {
          endpointId: '@endpointId',
          action: 'devices',
        },
      },
      executeDeviceAction: {
        method: 'POST',
        params: {
          endpointId: '@endpointId',
          action: 'devices',
          deviceId: '@deviceId',
          deviceAction: '@deviceAction',
        },
      },
    }
  );
}
