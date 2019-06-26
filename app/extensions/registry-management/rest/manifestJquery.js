/**
 * This service has been created to request the docker registry API
 * without triggering AngularJS digest cycles
 * For more information, see https://github.com/portainer/portainer/pull/2648#issuecomment-505644913
 */

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
            'If-Modified-Since':'Mon, 26 Jul 1997 05:00:00 GMT',
            'Authorization': 'Bearer ' + LocalStorage.getJWT()
          },
          success: function (result, status, request) {
            result.digest = request.getResponseHeader('Docker-Content-Digest');
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
