/**
 * This service has been created to request the docker registry API
 * without triggering AngularJS digest cycles
 * For more information, see https://github.com/portainer/portainer/pull/2648#issuecomment-505644913
 */

import $ from 'jquery';

angular.module('portainer.extensions.registrymanagement')
.factory('RegistryManifestsJquery', ['API_ENDPOINT_REGISTRIES',
 function RegistryManifestsJqueryFactory(API_ENDPOINT_REGISTRIES) {
  'use strict';

  function buildUrl(params) {
    return API_ENDPOINT_REGISTRIES + '/' + params.id + '/v2/' + params.repository + '/manifests/'+ params.tag;
  }

  function get(params) {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'GET',
        dataType: 'JSON',
        url: buildUrl(params),
        headers: {
          'Cache-Control': 'no-cache',
          'If-Modified-Since':'Mon, 26 Jul 1997 05:00:00 GMT'
        },
        success: (result) => resolve(result),
        error: (error) => reject(error)
      })
    });
  }

  function getV2(params) {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'GET',
        dataType: 'JSON',
        url: buildUrl(params),
        headers: {
          'Accept': 'application/vnd.docker.distribution.manifest.v2+json',
          'Cache-Control': 'no-cache',
          'If-Modified-Since':'Mon, 26 Jul 1997 05:00:00 GMT'
        },
        success: (result, status, request) => {
          result.digest = request.getResponseHeader('Docker-Content-Digest');
          resolve(result);
        },
        error: (error) => reject(error)
      })
    });
  }

  function put(params, data) {
    const transformRequest = (d) => {
      return angular.toJson(d, 3);
    }
    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'PUT',
        url: buildUrl(params),
        headers: {
          'Content-Type': 'application/vnd.docker.distribution.manifest.v2+json'
        },
        data: transformRequest(data),
        success: (result) => resolve(result),
        error: (error) => reject(error)
      });
    })
  }

  return {
    get: get,
    getV2: getV2,
    put: put
  }
}]);
