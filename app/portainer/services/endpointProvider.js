angular.module('portainer.app')
.factory('EndpointProvider', ['LocalStorage', function EndpointProviderFactory(LocalStorage) {
  'use strict';
  var service = {};
  var endpoint = {};

  service.initialize = function() {
    var endpointID = LocalStorage.getEndpointID();
    var endpointPublicURL = LocalStorage.getEndpointPublicURL();
    if (endpointID) {
      endpoint.ID = endpointID;
    }
    if (endpointPublicURL) {
      endpoint.PublicURL = endpointPublicURL;
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

  service.endpointPublicURL = function() {
    return endpoint.PublicURL;
  };

  service.setEndpointPublicURL = function(publicURL) {
    endpoint.PublicURL = publicURL;
    LocalStorage.storeEndpointPublicURL(publicURL);
  };

  return service;
}]);
