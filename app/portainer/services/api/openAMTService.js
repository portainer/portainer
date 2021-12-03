import angular from 'angular';

angular.module('portainer.app').service('OpenAMTService', OpenAMTServiceFactory);

/* @ngInject */
function OpenAMTServiceFactory(OpenAMT) {
  return {
    submit,
  };

  function submit(formValues) {
    return OpenAMT.submit(formValues).$promise;
  }
}
