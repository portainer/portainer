angular.module('portainer.kubernetes')
.factory('KubernetesHealthService', ['$async', 'KubernetesHealth', function KubernetesHealthServiceFactory($async, KubernetesHealth) {
  'use strict';
  const service = {};

  service.ping = ping;

  async function pingAsync() {
    try {
      return await KubernetesHealth.ping().$promise;
    } catch (err) {
      throw { msg: 'Unable to retrieve environment health', err: err };
    }
  }

  function ping() {
    return $async(pingAsync);
  }

  return service;
}]);
