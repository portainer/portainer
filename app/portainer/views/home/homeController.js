angular.module('portainer.app')
.controller('HomeController', ['$q', '$scope', '$state', 'Authentication', 'EndpointService', 'EndpointHelper', 'GroupService', 'Notifications', 'EndpointProvider', 'StateManager', 'ExtensionManager',
function ($q, $scope, $state, Authentication, EndpointService, EndpointHelper, GroupService, Notifications, EndpointProvider, StateManager, ExtensionManager) {

  // TODO: these 3 functions looks like a dup of sidebarcontroller functions
  $scope.goToDashboard = function(endpoint) {
    EndpointProvider.setEndpointID(endpoint.Id);
    EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
    if (endpoint.Type === 3) {
      switchToAzureEndpoint(endpoint);
    } else {
      switchToDockerEndpoint(endpoint);
    }
  };

  function switchToAzureEndpoint(endpoint) {
    StateManager.updateEndpointState(false, endpoint.Type, [])
    .then(function success() {
      $state.go('azure.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Azure endpoint');
    });
  }

  function switchToDockerEndpoint(endpoint) {
    ExtensionManager.initEndpointExtensions(endpoint.Id)
    .then(function success(data) {
      var extensions = data;
      return StateManager.updateEndpointState(false, endpoint.Type, extensions);
    })
    .then(function success() {
      $state.go('docker.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
    });
  }

  function initView() {
    $scope.isAdmin = Authentication.getUserDetails().role === 1;

    $q.all({
      endpoints: EndpointService.endpoints(),
      groups: GroupService.groups()
    })
    .then(function success(data) {
      var endpoints = data.endpoints;
      var groups = data.groups;
      EndpointHelper.mapGroupNameToEndpoint(endpoints, groups);
      $scope.endpoints = endpoints;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint information');
    });
  }

  initView();
}]);
