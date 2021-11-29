import angular from 'angular';

angular.module('portainer.app').service('OpenAMTService', OpenAMTServiceFactory);

/* @ngInject */
function OpenAMTServiceFactory(OpenAMT) {
  return {
    submit,
    getDevices,
  };

  function submit(formValues) {
    return OpenAMT.submit(formValues).$promise;
  }

  function getDevices(endpointID) {
    return OpenAMT.getDevices({ id: endpointID }).$promise;
  }
}
