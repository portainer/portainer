import angular from 'angular';

angular.module('portainer.app').service('SSLService', SSLServiceFactory);

/* @ngInject */
function SSLServiceFactory(SSL) {
  return {
    upload,
    get,
  };

  function get() {
    return SSL.get().$promise;
  }

  function upload(SSLPayload) {
    return SSL.upload(SSLPayload).$promise;
  }
}
