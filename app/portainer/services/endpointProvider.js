import _ from 'lodash-es';

angular.module('portainer.app')
.factory('EndpointProvider', ['LocalStorage', function EndpointProviderFactory(LocalStorage) {
  'use strict';
  var service = {};
  var endpoint = {};

  service.initialize = function() {
    var endpointID = LocalStorage.getEndpointID();
    var endpointPublicURL = LocalStorage.getEndpointPublicURL();
    var offlineMode = LocalStorage.getOfflineMode();

    if (endpointID) {
      endpoint.ID = endpointID;
    }
    if (endpointPublicURL) {
      endpoint.PublicURL = endpointPublicURL;
    }
    if (offlineMode) {
      endpoint.OfflineMode = offlineMode;
    }
  };

  service.clean = function() {
    endpoint = {};
  };

  service.endpoint = function() {
    return endpoint;
  };

  service.endpointID = function() {
    if (endpoint.ID === undefined) {
      endpoint.ID = LocalStorage.getEndpointID();
    }
    return endpoint.ID;
  };

  service.setEndpointID = function(id) {
    endpoint.ID = id;
    LocalStorage.storeEndpointID(id);
  };

  service.endpointPublicURL = function() {
    if (endpoint.PublicURL === undefined) {
      endpoint.PublicURL = LocalStorage.getEndpointPublicURL();
    }
    return endpoint.PublicURL;
  };

  service.setEndpointPublicURL = function(publicURL) {
    endpoint.PublicURL = publicURL;
    LocalStorage.storeEndpointPublicURL(publicURL);
  };

  service.endpoints = function() {
    return LocalStorage.getEndpoints();
  };

  service.setEndpoints = function(data) {
    LocalStorage.storeEndpoints(data);
  };

  service.offlineMode = function() {
    return endpoint.OfflineMode;
  };

  service.setOfflineMode = function(isOffline) {
    endpoint.OfflineMode = isOffline;
    LocalStorage.storeOfflineMode(isOffline);
  };

  service.setOfflineModeFromStatus = function(status) {
    var isOffline = status !== 1;
    endpoint.OfflineMode = isOffline;
    LocalStorage.storeOfflineMode(isOffline);
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
