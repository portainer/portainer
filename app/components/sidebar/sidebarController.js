angular.module('sidebar', [])
.controller('SidebarController', ['$q', '$scope', '$state', 'InfraService', 'Settings', 'EndpointService', 'StateManager', 'EndpointProvider', 'Notifications', 'Authentication', 'UserService',
function ($q, $scope, $state, InfraService, Settings, EndpointService, StateManager, EndpointProvider, Notifications, Authentication, UserService) {

  $scope.uiVersion = StateManager.getState().application.version;
  $scope.displayExternalContributors = StateManager.getState().application.displayExternalContributors;
  $scope.logo = StateManager.getState().application.logo;
  $scope.endpoints = [];

  $scope.switchEndpoint = function(endpoint) {
    var activeEndpointID = EndpointProvider.endpointID();
    var activeEndpointPublicURL = EndpointProvider.endpointPublicURL();
    EndpointProvider.setEndpointID(endpoint.Id);
    EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
    StateManager.updateEndpointState(true)
    .then(function success() {
      $scope.activeEndpoint = endpoint;
      $state.go('idashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
      EndpointProvider.setEndpointID(activeEndpointID);
      EndpointProvider.setEndpointPublicURL(activeEndpointPublicURL);
      StateManager.updateEndpointState(true)
      .then(function success() {});
    });
  };

  function setActiveEndpoint(endpoints) {
    var activeEndpointID = EndpointProvider.endpointID();
    var swarms = InfraService.getSwarms();
    // Find any nodes, matched by IP vs. EP PublicURL, to determine the swarm EPs
    eps = [];
    for (var i = 0; i < swarms.length; i++) {
        var swarmEntry = swarms[i];
        if (swarmEntry.id == activeEndpointID) {
            for (var j = 0; j < swarmEntry.nodes.length; j++) {
                var node = swarmEntry.nodes[j];
                for (var k = 0; k < endpoints.length; k++) {
                    var ep = endpoints[k];
                    if (ep.PublicURL == node.Addr) {
                        eps.push(ep);
                    }
                }
            }
            break;
        }
    }
    angular.forEach(endpoints, function (endpoint) {
      if (endpoint.Id == activeEndpointID) {
        $scope.activeEndpoint = endpoint;
        EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
        if (eps.length == 0) {
            eps.push(endpoint);
        }
      }
    });
    $scope.endpoints = _.sortBy(eps, ['Name']);
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
    $scope.applicationState.loading = false;

    EndpointService.endpoints()
    .then(function success(data) {
      var endpoints = data;
      //$scope.endpoints = _.sortBy(endpoints, ['Name']);
      setActiveEndpoint(endpoints);

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
