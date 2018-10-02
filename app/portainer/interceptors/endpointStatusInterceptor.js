angular.module('portainer.app')
  .factory('EndpointStatusInterceptor', ['$q', '$injector', function ($q, $injector) {
    return {
      response: function (response) {
        var StateManager = $injector.get('StateManager');
        if (response.status === 200) {
          if (StateManager.getState().endpoint.status === 2) {
            StateManager.setEndpointStatus(1);
          }
        }
        return response || $q.when(response);
      },
      responseError: function (rejection) {
        var StateManager = $injector.get('StateManager');
        if (rejection.status === 502 || rejection.status === -1) {
          if (StateManager.getState().endpoint.status === 1) {
            StateManager.setEndpointStatus(2);
          }
        }
        return $q.reject(rejection);
      }
    };
  }]);