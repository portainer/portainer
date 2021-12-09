import angular from 'angular';

angular.module('portainer.app').service('FDOService', FDOServiceFactory);

/* @ngInject */
function FDOServiceFactory(FDO) {
  return {
    submit,
    configureDevice,
  };

  function submit(formValues) {
    return FDO.submit(formValues).$promise;
  }

  function configureDevice(deviceId, formValues) {
    return FDO.configureDevice({ deviceId: deviceId }, formValues).$promise;
  }
}
