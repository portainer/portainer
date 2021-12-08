import angular from 'angular';

angular.module('portainer.app').service('OpenAMTService', OpenAMTServiceFactory);

/* @ngInject */
function OpenAMTServiceFactory(OpenAMT) {
  return {
    submit,
    info,
    authorization,
    activateDevice,
    getDevices,
    executeDeviceAction,
    enableDeviceFeatures,
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
    return OpenAMT.executeDeviceAction({ id: endpointID, deviceId: deviceGUID, deviceAction: deviceAction }).$promise;
  }

  function activateDevice(endpointID) {
    return OpenAMT.activate({ id: endpointID }).$promise;
  }

  function enableDeviceFeatures(endpointID, deviceGUID, enabledFeatures) {
    return OpenAMT.enableDeviceFeatures({ id: endpointID, deviceId: deviceGUID, enabledFeatures: enabledFeatures }).$promise;
  }
}
