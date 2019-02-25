angular.module('extension.storidge')
.controller('StoridgeClusterController', ['$q', '$scope', '$state', 'clipboard', 'Notifications', 'StoridgeClusterService', 'StoridgeNodeService', 'ModalService',
function ($q, $scope, $state, clipboard, Notifications, StoridgeClusterService, StoridgeNodeService, ModalService) {

  $scope.state = {
    shutdownInProgress: false,
    rebootInProgress: false
  };

  $scope.copyAddNodeCommand = function() {
    clipboard.copyText($scope.addInfo);
    $('#copyNotification').show();
    $('#copyNotification').fadeOut(2000);
  };

  $scope.removeAction = function(selectedItems) {
    ModalService.confirm({
      title: 'Are you sure?',
      message: 'Do you want really want to remove the nodes from the cluster?',
      buttons: {
        confirm: {
          label: 'Remove',
          className: 'btn-danger'
        }
      },
      callback: function onConfirm(confirmed) {
        if(!confirmed) { return; }
        remove(selectedItems);
      }
    });
  };

  function remove(selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (node) {
      StoridgeNodeService.remove(node.Name)
      .then(function success() {
        Notifications.success('Node successfully removed', node.Name);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove node');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  }

  $scope.cordonNodeAction = function(selectedItems) {
    ModalService.confirm({
      title: 'Are you sure?',
      message: 'Do you want really want to put the nodes in maintenance mode?',
      buttons: {
        confirm: {
          label: 'Cordon',
          className: 'btn-danger'
        }
      },
      callback: function onConfirm(confirmed) {
        if(!confirmed) { return; }
        cordonNode(selectedItems);
      }
    });
  };

  function cordonNode(selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (node) {
      StoridgeNodeService.cordon(node.Name)
      .then(function success() {
        Notifications.success('Node successfully put in maintenance', node.Name);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to put node in maintenance mode');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  }

  $scope.uncordonNodeAction = function(selectedItems) {
    ModalService.confirm({
      title: 'Are you sure?',
      message: 'Do you want really want to bring the nodes out of maintenance mode?',
      buttons: {
        confirm: {
          label: 'Uncordon',
          className: 'btn-danger'
        }
      },
      callback: function onConfirm(confirmed) {
        if(!confirmed) { return; }
        uncordonNode(selectedItems);
      }
    });
  };

  function uncordonNode(selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (node) {
      StoridgeNodeService.uncordon(node.Name)
      .then(function success() {
        Notifications.success('Node successfully bringed back', node.Name);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to put node out of maintenance mode');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  }

  $scope.rebootCluster = function() {
    ModalService.confirm({
      title: 'Are you sure?',
      message: 'All the nodes in the cluster will reboot during the process. Do you want to reboot the Storidge cluster?',
      buttons: {
        confirm: {
          label: 'Reboot',
          className: 'btn-danger'
        }
      },
      callback: function onConfirm(confirmed) {
        if(!confirmed) { return; }
        rebootCluster();
      }
    });
  };

  function rebootCluster() {
    $scope.state.rebootInProgress = true;
    StoridgeClusterService.reboot()
    .finally(function final() {
      $scope.state.rebootInProgress = false;
      Notifications.success('Cluster successfully rebooted');
      $state.reload();
    });
  }

  $scope.shutdownCluster = function() {
    ModalService.confirm({
      title: 'Are you sure?',
      message: 'All the nodes in the cluster will shutdown. Do you want to shutdown the Storidge cluster?',
      buttons: {
        confirm: {
          label: 'Shutdown',
          className: 'btn-danger'
        }
      },
      callback: function onConfirm(confirmed) {
        if(!confirmed) { return; }
        shutdownCluster();
      }
    });
  };

  function shutdownCluster() {
    $scope.state.shutdownInProgress = true;
    StoridgeClusterService.shutdown()
    .finally(function final() {
      $scope.state.shutdownInProgress = false;
      Notifications.success('Cluster successfully shutdown');
      $state.go('docker.dashboard');
    });
  }

  function initView() {
    $q.all({
      info: StoridgeClusterService.info(),
      version: StoridgeClusterService.version(),
      nodes: StoridgeNodeService.nodes(),
      addInfo: StoridgeNodeService.add()
    })
    .then(function success(data) {
      $scope.clusterInfo = data.info;
      $scope.clusterVersion = data.version;
      $scope.clusterNodes = data.nodes;
      $scope.addInfo = data.addInfo.content;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve cluster information');
    });
  }

  initView();
}]);
