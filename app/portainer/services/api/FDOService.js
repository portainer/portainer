import angular from 'angular';

angular.module('portainer.app').service('FDOService', FDOServiceFactory);

/* @ngInject */
function FDOServiceFactory(FDO) {
  return {
    submit,
  };

  function submit(formValues) {
    return FDO.submit(formValues).$promise;
  }
}
