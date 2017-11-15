angular.module('sidebar', [])
.controller('SidebarController', ['$q', '$scope', '$state', 'InfraService', 'Settings', 'EndpointService', 'StateManager', 'EndpointProvider', 'Notifications', 'Authentication', 'UserService',
function ($q, $scope, $state, InfraService, Settings, EndpointService, StateManager, EndpointProvider, Notifications, Authentication, UserService) {

  $scope.uiVersion = StateManager.getState().application.version;
  $scope.displayExternalContributors = StateManager.getState().application.displayExternalContributors;
  $scope.logo = StateManager.getState().application.logo;
  $scope.endpoints = [];
  var cachedEndpoints = [];
  var savedEPId = "";

  $scope.switchEndpoint = function(endpoint) {
    $scope.switchedEndpointId = endpoint.Id;

    for (var i = 0; i < $scope.endpoints.length; i++) {
        var epEntry = $scope.endpoints[i];
        if (epEntry.Name == endpoint.Name) {
            endpoint = epEntry;
            break;
        }
    }

    var activeEndpointID = EndpointProvider.endpointID();
    var activeEndpointPublicURL = EndpointProvider.endpointPublicURL();
    EndpointProvider.setEndpointID(endpoint.Id);
    EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
    StateManager.updateEndpointState(true)
    .then(function success() {
      $scope.activeEndpoint = endpoint;
      setActiveEndpoint(cachedEndpoints, false);
      $state.go('dashboard({endpointid: endpoint.Id, frominfra: false})')
    })
    .catch(function error(err) {

      $scope.switchedEndpointId = activeEndpointID;

      Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
      EndpointProvider.setEndpointID(activeEndpointID);
      EndpointProvider.setEndpointPublicURL(activeEndpointPublicURL);
      StateManager.updateEndpointState(true)
      .then(function success() {});
    });
  };

  function setActiveEndpoint(endpoints, fromInit) {
    var activeEndpointID = EndpointProvider.endpointID();

    if (fromInit == false) {
        EndpointProvider.setSwitchedEndpointID(activeEndpointID);
    } else {
        if (EndpointProvider.getSwitchedEndpointID() != "" && EndpointProvider.getSwitchedEndpointID() != activeEndpointID) {
            activeEndpointID = EndpointProvider.getSwitchedEndpointID();
            EndpointProvider.setEndpointID(activeEndpointID);
        }
    }

    var swarmEPs = InfraService.getCachedSwarmEndpoints();
    foundEntry = false;
    for (var i = 0; i < swarmEPs.length; i++) {
        var swarmEP = swarmEPs[i];
        if (swarmEP.Id == activeEndpointID) {
            foundEntry = true;
            break;
        }
    }
    if (foundEntry == false) {
        InfraService.setCachedSwarmEndpoints([]);
        swarmEPs = [];
    } else {
        // Correct any anomolies -- out of sync data
        for (var j = 0; j < swarmEPs.length; j++) {
            for (var k = 0; k < cachedEndpoints.length; k++) {
                if ((swarmEPs[j].Name == cachedEndpoints[k].Name) && (swarmEPs[j].Id != cachedEndpoints[k].Id)) {
                    for (var l = 0; l < cachedEndpoints.length; l++) {
                        if (swarmEPs[j].Id == cachedEndpoints[l].Id) {
                            swarmEPs[j] = cachedEndpoints[l];
                            break;
                        }
                    }
                }
            }
        }
    }

    var eps = [];
    if (swarmEPs.length == 0) {
        var swarms = InfraService.getSwarms();

        if (swarms.length == 0 && InfraService.getDataLoading() == false) {
          InfraService.getEndpointStates(endpoints)
          .then(function success(data) {
            var foundSwarms = [];
            for (var i = 0; i < data.length; i++) {
                var epEntry = data[i];

                // TODO: improve this mapping, likely on initial EP setup...
                for (var j = 0; j < endpoints.length; j++) {
                    var oldEpEntry = endpoints[j];
                    if (oldEpEntry.Id == epEntry.id) {
                        epEntry.name = oldEpEntry.Name;
                        break;
                    }
                }

                if (epEntry.provider == "DOCKER_SWARM_MODE") {
                    foundSwarms.push(epEntry);
                }
            }
            swarms = foundSwarms;
          });
        }

        // Find any nodes, matched by IP vs. EP PublicURL, to determine the swarm EPs
        for (var i = 0; i < swarms.length; i++) {
            var swarmEntry = swarms[i];
            if (swarmEntry.id == activeEndpointID) {
                for (var j = 0; j < swarmEntry.nodes.length; j++) {
                    var node = swarmEntry.nodes[j];
                    for (var k = 0; k < endpoints.length; k++) {
                        var ep = endpoints[k];
                        if (ep.PublicURL == node.Addr) {
                            eps.push(ep);
                            break;
                        }
                    }
                }
                break;
            }
        }

        InfraService.setCachedSwarmEndpoints(eps);
    } else {
        eps = swarmEPs;
    }

    angular.forEach(endpoints, function (endpoint) {
      if (endpoint.Id == activeEndpointID) {
        $scope.activeEndpoint = endpoint;
        EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
        if (eps.length == 0) {
            eps.push(endpoint);
            InfraService.setCachedSwarmEndpoints([endpoint]);
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
      cachedEndpoints = data;
      //$scope.endpoints = _.sortBy(endpoints, ['Name']);

      setActiveEndpoint(cachedEndpoints, true);

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
