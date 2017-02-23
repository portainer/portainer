angular.module('sidebar', [])
.controller('SidebarController', ['$scope', '$state', 'Settings', 'Config', 'EndpointService', 'StateManager', 'EndpointProvider', 'Messages', 'Authentication',
function ($scope, $state, Settings, Config, EndpointService, StateManager, EndpointProvider, Messages, Authentication) {

  Config.$promise.then(function (c) {
    $scope.logo = c.logo;
  });

  $scope.uiVersion = Settings.uiVersion;
  $scope.userRole = Authentication.getUserDetails().role;

  $scope.switchEndpoint = function(endpoint) {
    EndpointProvider.setEndpointID(endpoint.Id);
    StateManager.updateEndpointState(true)
    .then(function success() {
      $state.go('dashboard');
    })
    .catch(function error(err) {
      Messages.error("Failure", err, "Unable to connect to the Docker endpoint");
    });
  };

  function fetchEndpoints() {
    EndpointService.endpoints()
    .then(function success(data) {
      $scope.endpoints = data;
      var activeEndpointID = EndpointProvider.endpointID();
      angular.forEach($scope.endpoints, function (endpoint) {
        if (endpoint.Id === activeEndpointID) {
          $scope.activeEndpoint = endpoint;
        }
      });
    })
    .catch(function error(err) {
      $scope.endpoints = [];
    });
  }

  fetchEndpoints();
}]);
