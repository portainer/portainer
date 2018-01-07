angular.module('portainer.services')
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

    // STORIDGE_TMP
    // var storidgeAPI = LocalStorage.getStoridgeAPI();
    // if (storidgeAPI) {
    //   endpoint.StoridgeAPI = storidgeAPI;
    // }
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

  // STORIDGE_TMP
  // service.StoridgeAPI = function() {
  //   return endpoint.StoridgeAPI;
  // };

  // STORIDGE_TMP
  // service.setStoridgeAPI = function(storidgeAPI) {
  //   endpoint.StoridgeAPI = storidgeAPI;
  //   LocalStorage.storeStoridgeAPI(storidgeAPI);
  // };

  // STORIDGE_TMP
  // service.setStoridgeAPIFromURL = function(endpointURL) {
  //   if (endpointURL.indexOf('unix://') === -1) {
  //     var storidgeURL = 'http://' + _.split(endpointURL.replace('tcp://', ''), ':')[0] + ':8282';
  //     endpoint.StoridgeAPI = storidgeURL;
  //     LocalStorage.storeStoridgeAPI(storidgeURL);
  //   }
  // };

  return service;
}]);
