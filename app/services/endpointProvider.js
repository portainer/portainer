angular.module('portainer.services')
.factory('EndpointProvider', ['LocalStorage', function EndpointProviderFactory(LocalStorage) {
  'use strict';
  var endpoint = {};
  var service = {};
  service.initialize = function() {
    var endpointID = LocalStorage.getEndpointID();
    var endpointURLPublish = LocalStorage.getEndpointURLPublish();
    if (endpointID) {
      endpoint.ID = endpointID;
    }
    if (endpointURLPublish) {
      endpoint.URLPublish = endpointURLPublish;
    }
  };
  service.clean = function() {
    endpoint = {};
  };
  service.endpointID = function() {
    return endpoint.ID;
  };
  service.setEndpointID = function(id) {
    endpoint.ID = id;
    LocalStorage.storeEndpointID(id);
  };
  service.endpointURLPublish = function() {
    return endpoint.URLPublish;
  }
  service.setEndpointURLPublish = function(urlPublish) {
    endpoint.URLPublish = urlPublish;
    LocalStorage.storeEndpointURLPublish(urlPublish);
  }
  return service;
}]);
