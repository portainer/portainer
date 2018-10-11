angular.module('portainer.app')
  .factory('EndpointStatusInterceptor', ['$q', '$injector', function ($q, $injector) {
    function canBeOffline(url) {
      return (_.startsWith(url, 'api/') && (
        _.includes(url, '/containers') ||
        _.includes(url, '/images') ||
        _.includes(url, '/volumes') ||
        _.includes(url, '/networks') ||
        _.includes(url, '/info') ||
        _.includes(url, '/version') ||
        _.includes(url, '/_ping')
      ));
    }

    return {
      response: function (response) {
        var StateManager = $injector.get('StateManager');
        var url = response.config.url;
        if (response.status === 200 && canBeOffline(url) && StateManager.getState().endpoint.status === 2) {
          StateManager.setEndpointStatus(1);
        }
        return response || $q.when(response);
      },
      responseError: function (rejection) {
        var StateManager = $injector.get('StateManager');
        var url = rejection.config.url;
        if ((rejection.status === 502 || rejection.status === -1) && canBeOffline(url) && StateManager.getState().endpoint.status === 1) {
          StateManager.setEndpointStatus(2);
        }
        return $q.reject(rejection);
      }
    };
  }]);