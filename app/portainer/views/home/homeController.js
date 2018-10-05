angular.module('portainer.app')
.controller('HomeController', ['$q', '$scope', '$state', 'Authentication', 'EndpointService', 'EndpointHelper', 'GroupService', 'Notifications', 'EndpointProvider', 'StateManager', 'ExtensionManager', 'ModalService', 'MotdService',
function ($q, $scope, $state, Authentication, EndpointService, EndpointHelper, GroupService, Notifications, EndpointProvider, StateManager, ExtensionManager, ModalService, MotdService) {

  function notifyAndResetState(notification, backup) {
    Notifications.error('Failure', '', notification);
    EndpointProvider.setEndpointID(backup.id);
    EndpointProvider.setEndpointPublicURL(backup.publicURL);
  }

  $scope.goToDashboard = function(endpoint) {
    var currentEndpointBackup = {
      id: EndpointProvider.endpointID(),
      publicURL: EndpointProvider.endpointPublicURL()
    };
    EndpointProvider.setEndpointID(endpoint.Id);
    EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
    StateManager.checkEndpointStatus()
    .then(function sucess() {
      endpoint.Status = 1;
    }).catch(function error() {
      endpoint.Status = 2;
    }).finally(function () {
      if (endpoint.Status === 1) {
        if (endpoint.Type === 3) {
          switchToAzureEndpoint(endpoint);
        } else {
          switchToDockerEndpoint(endpoint);
        }
      } else {
        if (endpoint.Type === 3) {
          notifyAndResetState('Endpoint is unreachable. Offline browsing disabled for Azure endpoints.', currentEndpointBackup);
        } else if (endpoint.Snapshots[0] && endpoint.Snapshots[0].Swarm === true) {
          notifyAndResetState('Endpoint is unreachable. Connect to another swarm manager.', currentEndpointBackup);
        } else if (!endpoint.Snapshots[0]) {
          notifyAndResetState('Endpoint is unreachable and there is no snapshot available for offline browsing.', currentEndpointBackup);
        } else {
          switchToDockerEndpoint(endpoint);
        }
      }
    });
  };

  $scope.dismissImportantInformation = function(hash) {
    StateManager.dismissImportantInformation(hash);
  };

  $scope.dismissInformationPanel = function(id) {
    StateManager.dismissInformationPanel(id);
  };

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

  $scope.triggerSnapshot = function() {
    ModalService.confirmEndpointSnapshot(function (result) {
      if(!result) { return; }
      triggerSnapshot();
    });
  };

  function switchToAzureEndpoint(endpoint) {
    StateManager.updateEndpointState(endpoint.Name, endpoint.Type, endpoint.Status, [])
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
      return StateManager.updateEndpointState(endpoint.Name, endpoint.Type, endpoint.Status, extensions);
    })
    .then(function success() {
      $state.go('docker.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
    });
  }

  $scope.goToEdit = goToEdit;

  function goToEdit(id) {
    $state.go('portainer.endpoints.endpoint', { id: id });
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
