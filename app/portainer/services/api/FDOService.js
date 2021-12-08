import angular from 'angular';

angular.module('portainer.app').service('FDOService', FDOServiceFactory);

/* @ngInject */
function FDOServiceFactory(FDO) {
  return {
    submit,
    importDevice,
  };

  function submit(formValues) {
    return FDO.submit(formValues).$promise;
  }

  function importDevice(deviceId, formValues) {
    return FDO.importDevice({ deviceId: deviceId }, formValues).$promise;
  }
}
