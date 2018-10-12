angular.module('portainer.app')
  .factory('EndpointStatusInterceptor', ['$q', '$injector', 'EndpointProvider', function ($q, $injector, EndpointProvider) {
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

    return {
      response: function (response) {
        var EndpointService = $injector.get('EndpointService');
        var url = response.config.url;
        if (response.status === 200 && canBeOffline(url) && EndpointProvider.endpointStatus() === 2) {
          EndpointProvider.setEndpointStatus(1);
          EndpointService.updateEndpoint(EndpointProvider.endpointID(), {Status: 1});
        }
        return response || $q.when(response);
      },
      responseError: function (rejection) {
        var EndpointService = $injector.get('EndpointService');
        var url = rejection.config.url;
        if ((rejection.status === 502 || rejection.status === -1) && canBeOffline(url) && EndpointProvider.endpointStatus() === 1) {
          EndpointProvider.setEndpointStatus(2);
          EndpointService.updateEndpoint(EndpointProvider.endpointID(), {Status: 2});
        }
        return $q.reject(rejection);
      }
    };
  }]);