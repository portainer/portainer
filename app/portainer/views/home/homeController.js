angular.module('portainer.app')
.controller('HomeController', ['$q', '$scope', '$state', 'Authentication', 'EndpointService', 'EndpointHelper', 'GroupService', 'Notifications', 'EndpointProvider', 'StateManager', 'ExtensionManager', 'ModalService', 'MotdService', 'SystemService',
function ($q, $scope, $state, Authentication, EndpointService, EndpointHelper, GroupService, Notifications, EndpointProvider, StateManager, ExtensionManager, ModalService, MotdService, SystemService) {

  $scope.goToEdit = function(id) {
    $state.go('portainer.endpoints.endpoint', { id: id });
  };

  $scope.goToDashboard = function (endpoint) {
    if (endpoint.Type === 3) {
      return switchToAzureEndpoint(endpoint);
    }

    checkEndpointStatus(endpoint)
    .then(function sucess() {
      return switchToDockerEndpoint(endpoint);
    }).catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to verify endpoint status');
    });
  };

  $scope.dismissImportantInformation = function (hash) {
    StateManager.dismissImportantInformation(hash);
  };

  $scope.dismissInformationPanel = function (id) {
    StateManager.dismissInformationPanel(id);
  };

  $scope.triggerSnapshot = function () {
    ModalService.confirmEndpointSnapshot(function (result) {
      if (!result) {
        return;
      }
      triggerSnapshot();
    });
  };

  function checkEndpointStatus(endpoint) {
    var deferred = $q.defer();

    var status = 1;
    SystemService.ping(endpoint.Id)
    .then(function sucess() {
      status = 1;
    }).catch(function error() {
      status = 2;
    }).finally(function () {
      if (endpoint.Status === status) {
        deferred.resolve(endpoint);
        return deferred.promise;
      }

      EndpointService.updateEndpoint(endpoint.Id, { Status: status })
      .then(function sucess() {
        deferred.resolve(endpoint);
      }).catch(function error(err) {
        deferred.reject({msg: 'Unable to update endpoint status', err: err});
      });
    });

    return deferred.promise;
  }

  function switchToAzureEndpoint(endpoint) {
    EndpointProvider.setEndpointID(endpoint.Id);
    EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
    EndpointProvider.setOfflineModeFromStatus(endpoint.Status);
    StateManager.updateEndpointState(endpoint.Name, endpoint.Type, [])
    .then(function success() {
      $state.go('azure.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Azure endpoint');
    });
  }

  function switchToDockerEndpoint(endpoint) {
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
    ExtensionManager.initEndpointExtensions(endpoint)
    .then(function success(data) {
      var extensions = data;
      return StateManager.updateEndpointState(endpoint, extensions);
    })
    .then(function success() {
      $state.go('docker.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
    });
  }

  function triggerSnapshot() {
    EndpointService.snapshot()
    .then(function success() {
      Notifications.success('Success', 'Endpoints updated');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'An error occured during endpoint snapshot');
    });
  }

  function initView() {
    $scope.isAdmin = Authentication.getUserDetails().role === 1;

    MotdService.motd()
    .then(function success(data) {
      $scope.motd = data;
    });

    $q.all({
      endpoints: EndpointService.endpoints(),
      groups: GroupService.groups()
    })
    .then(function success(data) {
      var endpoints = data.endpoints;
      var groups = data.groups;
      EndpointHelper.mapGroupNameToEndpoint(endpoints, groups);
      $scope.endpoints = endpoints;
      EndpointProvider.setEndpoints(endpoints);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint information');
    });
  }

  initView();
}]);
