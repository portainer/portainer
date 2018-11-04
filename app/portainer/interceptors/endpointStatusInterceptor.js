import _ from 'lodash';

angular.module('portainer.app')
  .factory('EndpointStatusInterceptor', ['$q', '$injector', 'EndpointProvider', function ($q, $injector, EndpointProvider) {
    'use strict';
    var interceptor = {};

    interceptor.response = responseInterceptor;
    interceptor.responseError = responseErrorInterceptor;

    function canBeOffline(url) {
      return (_.startsWith(url, 'api/') && (
        _.includes(url, '/containers') ||
        _.includes(url, '/images') ||
        _.includes(url, '/volumes') ||
        _.includes(url, '/networks') ||
        _.includes(url, '/info') ||
        _.includes(url, '/version')
      ));
    }

    function responseInterceptor(response) {
      var EndpointService = $injector.get('EndpointService');
      var url = response.config.url;
      if (response.status === 200 && canBeOffline(url) && EndpointProvider.offlineMode()) {
        EndpointProvider.setOfflineMode(false);
        EndpointService.updateEndpoint(EndpointProvider.endpointID(), {Status: EndpointProvider.endpointStatusFromOfflineMode(false)});
      }
      return response || $q.when(response);
    }

    function responseErrorInterceptor(rejection) {
      var EndpointService = $injector.get('EndpointService');
      var url = rejection.config.url;
      if ((rejection.status === 502 || rejection.status === -1) && canBeOffline(url) && !EndpointProvider.offlineMode()) {
        EndpointProvider.setOfflineMode(true);
        EndpointService.updateEndpoint(EndpointProvider.endpointID(), {Status: EndpointProvider.endpointStatusFromOfflineMode(true)});
      }
      return $q.reject(rejection);
    }

    return interceptor;
  }]);