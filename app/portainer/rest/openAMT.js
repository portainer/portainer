import angular from 'angular';

const API_ENDPOINT_OPEN_AMT = 'api/open_amt';

angular.module('portainer.app').factory('OpenAMT', OpenAMTFactory);

/* @ngInject */
function OpenAMTFactory($resource) {
  return $resource(
    API_ENDPOINT_OPEN_AMT + '/:id/:action/:deviceId/:deviceAction',
    {},
    {
      submit: { method: 'POST' },
      info: { method: 'GET', params: { id: '@id', action: 'info' } },
      activate: { method: 'POST', params: { id: '@id', action: 'activate' } },
      getDevices: { method: 'GET', params: { id: '@id', action: 'devices' } },
      executeDeviceAction: {
        method: 'POST',
        params: { id: '@id', action: 'devices', deviceId: '@deviceId', deviceAction: '@deviceAction' },
      },
      enableDeviceFeatures: {
        method: 'POST',
        params: { id: '@id', action: 'devices_features', deviceId: '@deviceId' },
      },
    }
  );
}
