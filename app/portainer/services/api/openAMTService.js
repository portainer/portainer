import angular from 'angular';

angular.module('portainer.app').service('OpenAMTService', OpenAMTServiceFactory);

/* @ngInject */
function OpenAMTServiceFactory(OpenAMT) {
  return {
    submit,
    getDevices,
    executeDeviceAction,
  };

  function submit(formValues) {
    return OpenAMT.submit(formValues).$promise;
  }

  function getDevices(endpointID) {
    return OpenAMT.getDevices({ endpointId: endpointID }).$promise;
  }

  function executeDeviceAction(endpointID, action, deviceGUID) {
    return OpenAMT.executeDeviceAction({ endpointId: endpointID, action: action, deviceGUID: deviceGUID }).$promise;
  }
}
