import angular from 'angular';

angular.module('portainer.app').service('OpenAMTService', OpenAMTServiceFactory);

/* @ngInject */
function OpenAMTServiceFactory(OpenAMT) {
  return {
    submit,
    info,
  };

  function submit(formValues) {
    return OpenAMT.submit(formValues).$promise;
  }

  function info(endpointID) {
    return OpenAMT.info({ id: endpointID }).$promise;
  }
}
