angular.module('sidebar', [])
.controller('SidebarController', ['$scope', '$state', 'Settings', 'Config', 'EndpointService', 'EndpointMode', 'Messages',
function ($scope, $state, Settings, Config, EndpointService, EndpointMode, Messages) {

  Config.$promise.then(function (c) {
    $scope.logo = c.logo;
  });

  $scope.uiVersion = Settings.uiVersion;

  $scope.switchEndpoint = function(endpoint) {
    EndpointService.setActive(endpoint.Id).then(function success(data) {
      EndpointMode.determineEndpointMode();
      $state.reload();
    }, function error(err) {
      Messages.error("Failure", err, "Unable to switch to new endpoint");
    });
  };

  function fetchEndpoints() {
    EndpointService.endpoints().then(function success(data) {
      $scope.endpoints = data;
      EndpointService.getActive().then(function success(data) {
        angular.forEach($scope.endpoints, function (endpoint) {
          if (endpoint.Id === data.Id) {
            $scope.activeEndpoint = endpoint;
          }
        });
      }, function error(err) {
        Messages.error("Failure", err, "Unable to retrieve active endpoint");
      });
    }, function error(err) {
      $scope.endpoints = [];
    });
  }

  fetchEndpoints();
}]);
