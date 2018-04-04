angular.module('portainer.docker')
  .controller('ContainersController', ['$q', '$scope', '$state', '$filter', '$transition$', 'ContainerService', 'SystemService', 'Notifications', 'ModalService', 'EndpointProvider', 'HttpRequestHelper',
  function ($q, $scope, $state, $filter, $transition$, ContainerService, SystemService, Notifications, ModalService, EndpointProvider, HttpRequestHelper) {
  $scope.state = {
    publicURL: EndpointProvider.endpointPublicURL()
  };

  $scope.startAction = function(selectedItems) {
    var successMessage = 'Container successfully started';
    var errorMessage = 'Unable to start container';
    executeActionOnContainerList(selectedItems, ContainerService.startContainer, successMessage, errorMessage);
  };

  $scope.stopAction = function(selectedItems) {
    var successMessage = 'Container successfully stopped';
    var errorMessage = 'Unable to stop container';
    executeActionOnContainerList(selectedItems, ContainerService.stopContainer, successMessage, errorMessage);
  };

  $scope.restartAction = function(selectedItems) {
    var successMessage = 'Container successfully restarted';
    var errorMessage = 'Unable to restart container';
    executeActionOnContainerList(selectedItems, ContainerService.restartContainer, successMessage, errorMessage);
  };

  $scope.killAction = function(selectedItems) {
    var successMessage = 'Container successfully killed';
    var errorMessage = 'Unable to kill container';
    executeActionOnContainerList(selectedItems, ContainerService.killContainer, successMessage, errorMessage);
  };

  $scope.pauseAction = function(selectedItems) {
    var successMessage = 'Container successfully paused';
    var errorMessage = 'Unable to pause container';
    executeActionOnContainerList(selectedItems, ContainerService.pauseContainer, successMessage, errorMessage);
  };

  $scope.resumeAction = function(selectedItems) {
    var successMessage = 'Container successfully resumed';
    var errorMessage = 'Unable to resume container';
    executeActionOnContainerList(selectedItems, ContainerService.resumeContainer, successMessage, errorMessage);
  };

  $scope.confirmRemoveAction = function(selectedItems) {
    var isOneContainerRunning = false;
    for (var i = 0; i < selectedItems.length; i++) {
      var container = selectedItems[i];
      if (container.State === 'running') {
        isOneContainerRunning = true;
        break;
      }
    }

    var title = 'You are about to remove one or more container.';
    if (isOneContainerRunning) {
      title = 'You are about to remove one or more running container.';
    }

    ModalService.confirmContainerDeletion(title, function (result) {
        if(!result) { return; }
        var cleanVolumes = false;
        if (result[0]) {
          cleanVolumes = true;
        }
        removeAction(selectedItems, cleanVolumes);
      }
    );
  };

  function executeActionOnContainerList(containers, action, successMessage, errorMessage) {
    var actionCount = containers.length;
    angular.forEach(containers, function (container) {
      HttpRequestHelper.setPortainerAgentTargetHeader(container.NodeName);
      action(container.Id)
      .then(function success() {
        Notifications.success(successMessage, container.Names[0]);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, errorMessage);
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.transitionTo($state.current, { selectedContainers: containers }, { reload: true });
        }
      });
    });
  }

  function removeAction(containers, cleanVolumes) {
    var actionCount = containers.length;
    angular.forEach(containers, function (container) {
      HttpRequestHelper.setPortainerAgentTargetHeader(container.NodeName);
      ContainerService.remove(container, cleanVolumes)
      .then(function success() {
        Notifications.success('Container successfully removed', container.Names[0]);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove container');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  }

  function assignContainers(containers) {
    var previouslySelectedContainers = $transition$.params().selectedContainers || [];
    $scope.containers = containers.map(function (container) {
      container.Status = $filter('containerstatus')(container.Status);

      var previousContainer = _.find(previouslySelectedContainers, function(item) {
        return item.Id === container.Id;
      });

      if (previousContainer && previousContainer.Checked) {
        container.Checked = true;
      }

      return container;
    });
  }

  function initView() {
    var provider = $scope.applicationState.endpoint.mode.provider;

    ContainerService.containers(1)
    .then(function success(data) {
      assignContainers(data);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve containers');
      $scope.containers = [];
    });
  }

  initView();
}]);
