import angular from 'angular';

angular.module('portainer.app').service('OpenAMTService', OpenAMTServiceFactory);

/* @ngInject */
function OpenAMTServiceFactory(OpenAMT) {
  return {
    submit,
    info,
    getDevices,
    executeDeviceAction,
  };

  function submit(formValues) {
    return OpenAMT.submit(formValues).$promise;
  }

  function info(endpointID) {
    return OpenAMT.info({ id: endpointID }).$promise;
  }

  function getDevices(endpointID) {
    return OpenAMT.getDevices({ id: endpointID }).$promise;
  }

  function executeDeviceAction(endpointID, deviceGUID, deviceAction) {
    return OpenAMT.executeDeviceAction({ id: endpointID, deviceId: deviceGUID, deviceAction: deviceAction }).$promise;
  }
}
