angular.module('portainer.app')
.controller('SidebarController', ['$q', '$scope', '$state', 'EndpointService', 'GroupService', 'StateManager', 'EndpointProvider', 'Notifications', 'Authentication', 'UserService', 'ExtensionManager',
function ($q, $scope, $state, EndpointService, GroupService, StateManager, EndpointProvider, Notifications, Authentication, UserService, ExtensionManager) {

  $scope.switchEndpoint = function(endpoint) {
    var activeEndpointID = EndpointProvider.endpointID();
    var activeEndpointPublicURL = EndpointProvider.endpointPublicURL();
    EndpointProvider.setEndpointID(endpoint.Id);
    EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);

    ExtensionManager.initEndpointExtensions(endpoint.Id)
    .then(function success(data) {
      var extensions = data;
      return StateManager.updateEndpointState(true, extensions);
    })
    .then(function success() {
      $state.go('docker.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
      EndpointProvider.setEndpointID(activeEndpointID);
      EndpointProvider.setEndpointPublicURL(activeEndpointPublicURL);
      StateManager.updateEndpointState(true)
      .then(function success() {});
    });
  };

  function checkPermissions(memberships) {
    var isLeader = false;
    angular.forEach(memberships, function(membership) {
      if (membership.Role === 1) {
        isLeader = true;
      }
    });
    $scope.isTeamLeader = isLeader;
  }

  function initView() {
    $scope.uiVersion = StateManager.getState().application.version;
    $scope.displayExternalContributors = StateManager.getState().application.displayExternalContributors;
    $scope.logo = StateManager.getState().application.logo;

    $q.all({
      endpoints: EndpointService.endpoints(),
      groups: GroupService.groups()
    })
    .then(function success(data) {
      var endpoints = data.endpoints;
      $scope.groups = data.groups;
      $scope.endpoints = endpoints;

      var activeEndpointID = EndpointProvider.endpointID();
      for (var i = 0; i < endpoints.length; i++) {
        var endpoint = endpoints[i];
        if (endpoint.Id === activeEndpointID) {
          $scope.activeEndpoint = endpoint;
          break;
        }
      }

      if (StateManager.getState().application.authentication) {
        var userDetails = Authentication.getUserDetails();
        var isAdmin = userDetails.role === 1 ? true: false;
        $scope.isAdmin = isAdmin;
        return $q.when(!isAdmin ? UserService.userMemberships(userDetails.ID) : []);
      }
    })
    .then(function success(data) {
      checkPermissions(data);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoints');
    });
  }

  initView();
}]);
