angular.module('portainer.app')
.factory('EndpointHelper', ['$q', '$state', 'SystemService', 'LegacyExtensionManager', 'Notifications', 'EndpointService', 'EndpointProvider', 'StateManager',
  function EndpointHelperFactory($q, $state, SystemService, LegacyExtensionManager, Notifications, EndpointService, EndpointProvider, StateManager) {
  'use strict';
  var helper = {};

  helper.activateEndpointAndRedirect = activateEndpointAndRedirect;
  helper.mapGroupNameToEndpoint = mapGroupNameToEndpoint;

  function activateEndpointAndRedirect(endpoint, redirect, redirectionParams) {
    var params = redirectionParams ? redirectionParams : {};

   if (endpoint.Type === 3) {
      return switchToAzureEndpoint(endpoint, redirect ? redirect : 'azure.dashboard', params);
    }

    checkEndpointStatus(endpoint)
      .then(function sucess() {
        return switchToDockerEndpoint(endpoint, redirect ? redirect : 'docker.dashboard', params);
      }).catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to verify endpoint status');
      });
  }

  function checkEndpointStatus(endpoint) {
    var deferred = $q.defer();

    var status = 1;
    SystemService.ping(endpoint.Id)
      .then(function sucess() {
        status = 1;
      }).catch(function error() {
        status = 2;
      }).finally(function() {
        if (endpoint.Status === status) {
          deferred.resolve(endpoint);
          return deferred.promise;
        }

        EndpointService.updateEndpoint(endpoint.Id, { Status: status })
          .then(function sucess() {
            deferred.resolve(endpoint);
          }).catch(function error(err) {
            deferred.reject({ msg: 'Unable to update endpoint status', err: err });
          });
      });

    return deferred.promise;
  }

  function switchToAzureEndpoint(endpoint, redirect, redirectionParams) {
    EndpointProvider.setEndpointID(endpoint.Id);
    EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
    EndpointProvider.setOfflineModeFromStatus(endpoint.Status);
    StateManager.updateEndpointState(endpoint, [])
      .then(function success() {
        $state.go(redirect, redirectionParams);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to connect to the Azure endpoint');
      });
  }

  function switchToDockerEndpoint(endpoint, redirect, redirectionParams) {
    if (endpoint.Status === 2 && endpoint.Snapshots[0] && endpoint.Snapshots[0].Swarm === true) {
      Notifications.error('Failure', '', 'Endpoint is unreachable. Connect to another swarm manager.');
      return;
    } else if (endpoint.Status === 2 && !endpoint.Snapshots[0]) {
      Notifications.error('Failure', '', 'Endpoint is unreachable and there is no snapshot available for offline browsing.');
      return;
    }

    EndpointProvider.setEndpointID(endpoint.Id);
    EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
    EndpointProvider.setOfflineModeFromStatus(endpoint.Status);
    LegacyExtensionManager.initEndpointExtensions(endpoint)
      .then(function success(data) {
        var extensions = data;
        return StateManager.updateEndpointState(endpoint, extensions);
      })
      .then(function success() {
        $state.go(redirect, redirectionParams);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
      });
  }

  function findAssociatedGroup(endpoint, groups) {
    return _.find(groups, function(group) {
      return group.Id === endpoint.GroupId;
    });
  }

  function mapGroupNameToEndpoint(endpoints, groups) {
    for (var i = 0; i < endpoints.length; i++) {
      var endpoint = endpoints[i];
      var group = findAssociatedGroup(endpoint, groups);
      if (group) {
        endpoint.GroupName = group.Name;
      }
    }
  }

  return helper;
}]);
