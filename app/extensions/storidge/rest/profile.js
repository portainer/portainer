angular.module('extension.storidge')
.factory('StoridgeProfiles', ['$http', '$resource', function StoridgeProfilesFactory($http, $resource) {
  'use strict';

  var API_URL = 'http://114.23.120.182:8080';

  var service = {};

  // service.query = function() {
  //   return $http({
  //     method: 'GET',
  //     url: API_URL + '/profiles',
  //     skipAuthorization: true
  //   });
  // };


  var resource = $resource(API_URL + '/profiles/:name', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { name: '@name' } },
    update: { method: 'PUT', params: { name: '@name' } },
    remove: { method: 'DELETE', params: { name: '@name'} }
  });

  // return service;
  return resource;
}]);
