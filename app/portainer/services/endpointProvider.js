angular.module('portainer.app')
.factory('EndpointProvider', ['LocalStorage', function EndpointProviderFactory(LocalStorage) {
  'use strict';
  var service = {};
  var endpoint = {};

  service.initialize = function() {
    var endpointID = LocalStorage.getEndpointID();
    var endpointPublicURL = LocalStorage.getEndpointPublicURL();
    var endpointStatus = LocalStorage.getEndpointStatus();
    if (endpointID) {
      endpoint.ID = endpointID;
    }
    if (endpointPublicURL) {
      endpoint.PublicURL = endpointPublicURL;
    }
    if (endpointStatus) {
      endpoint.Status = endpointStatus;
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

  service.endpointStatus = function() {
    return endpoint.Status;
  };

  service.setEndpointStatus = function(status) {
    endpoint.Status = status;
    LocalStorage.storeEndpointStatus(status);
  };

  service.endpoints = function() {
    return LocalStorage.getEndpoints();
  };

  service.setEndpoints = function(data) {
    LocalStorage.storeEndpoints(data);
  };

  service.currentEndpoint = function() {
    var endpointId = endpoint.ID;
    var endpoints = LocalStorage.getEndpoints();
    return _.find(endpoints, function (item) {
      return item.Id === endpointId;
    });
  };

  return service;
}]);
