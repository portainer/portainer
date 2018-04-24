angular.module('portainer.app')
.controller('SidebarController', ['$q', '$scope', '$state', 'Settings', 'EndpointService', 'GroupService', 'StateManager', 'EndpointProvider', 'Notifications', 'Authentication', 'UserService', 'ExtensionManager',
function ($q, $scope, $state, Settings, EndpointService, GroupService, StateManager, EndpointProvider, Notifications, Authentication, UserService, ExtensionManager) {

  $scope.switchEndpoint = function(endpoint) {
    switchEndpoint(endpoint);
  };

  $scope.switchGroup = function(group) {
    var groupEndpoints = $scope.endpoints.filter(function f(endpoint) {
      return endpoint.GroupId === group.Id;
    });
    $scope.groupEndpoints = groupEndpoints;
    $scope.activeEndpoint = groupEndpoints[0];
    switchEndpoint(groupEndpoints[0]);
  };

  function switchEndpoint(endpoint) {
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
  }

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

      // TODO: helper method? Filter empty groups.
      var groups = data.groups.filter(function f(group) {
        for (var i = 0; i < endpoints.length; i++) {
          var endpoint = endpoints[i];
          if (endpoint.GroupId === group.Id) {
            return true;
          }
        }
        return false;
      });

      $scope.endpoints = endpoints;

      var activeEndpointID = EndpointProvider.endpointID();
      var activeEndpoint = _.find(endpoints, { Id: activeEndpointID });
      EndpointProvider.setEndpointPublicURL(activeEndpoint.PublicURL);

      var activeGroup = _.find(groups, { Id: activeEndpoint.GroupId });
      var groupEndpoints = endpoints.filter(function f(endpoint) {
        return endpoint.GroupId === activeGroup.Id;
      });

      $scope.groups = groups;
      $scope.groupEndpoints = groupEndpoints;
      $scope.activeEndpoint = activeEndpoint;
      $scope.activeGroup = activeGroup;

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
