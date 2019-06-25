import $ from "jquery";

angular.module('portainer.extensions.registrymanagement')
.factory('RegistryManifestsJquery', ['API_ENDPOINT_REGISTRIES', 'LocalStorage',
 function RegistryManifestsJqueryFactory(API_ENDPOINT_REGISTRIES, LocalStorage) {
  'use strict';
  return {
    get: (params) => {
      return new Promise((resolve, reject) => {
        $.getJSON({
          url: API_ENDPOINT_REGISTRIES + '/' + params.id + '/v2/' + params.repository + '/manifests/'+ params.tag,
          headers: {
            'Accept': 'application/vnd.docker.distribution.manifest.v2+json',
            'Cache-Control': 'no-cache',
            'Authorization': 'Bearer ' + LocalStorage.getJWT()
          },
          success: function (result) {
            resolve(result);
          },
          error: function (error) {
              reject(error);
          }
        })
      });
    }
  }
}]);
