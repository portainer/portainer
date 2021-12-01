import angular from 'angular';

angular.module('portainer.app').service('OpenAMTService', OpenAMTServiceFactory);

/* @ngInject */
function OpenAMTServiceFactory(OpenAMT) {
  return {
    submit,
    info,
    authorization,
    getDevices,
    executeDeviceAction,
    associateEndpoint,
  };

  function submit(formValues) {
    return OpenAMT.submit(formValues).$promise;
  }

  function info(endpointID) {
    return OpenAMT.info({ id: endpointID }).$promise;
  }

  function authorization(endpointID) {
    return OpenAMT.authorization({ id: endpointID }).$promise;
  }

  function getDevices(endpointID) {
    return OpenAMT.getDevices({ id: endpointID }).$promise;
  }

  function executeDeviceAction(endpointID, deviceGUID, deviceAction) {
    return OpenAMT.executeDeviceAction({id: endpointID, deviceId: deviceGUID, deviceAction: deviceAction}).$promise;
  }

  function associateEndpoint(endpointID, deviceId) {
    return OpenAMT.associate({ id: endpointID, deviceId: deviceId }).$promise;
  }
}
