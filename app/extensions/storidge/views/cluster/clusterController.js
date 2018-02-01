angular.module('extension.storidge')
.controller('StoridgeClusterController', ['$q', '$scope', '$state', 'Notifications', 'StoridgeClusterService', 'StoridgeNodeService', 'StoridgeManager', 'ModalService',
function ($q, $scope, $state, Notifications, StoridgeClusterService, StoridgeNodeService, StoridgeManager, ModalService) {

  $scope.state = {
    shutdownInProgress: false,
    rebootInProgress: false
  };

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
    .then(function success(data) {
      Notifications.success('Cluster successfully shutdown');
      $state.go('docker.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to shutdown cluster');
    })
    .finally(function final() {
      $scope.state.shutdownInProgress = false;
    });
  }

  function rebootCluster() {
    $scope.state.rebootInProgress = true;
    StoridgeClusterService.reboot()
    .then(function success(data) {
      Notifications.success('Cluster successfully rebooted');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to reboot cluster');
    })
    .finally(function final() {
      $scope.state.rebootInProgress = false;
    });
  }

  function initView() {
    $q.all({
      info: StoridgeClusterService.info(),
      version: StoridgeClusterService.version(),
      nodes: StoridgeNodeService.nodes()
    })
    .then(function success(data) {
      $scope.clusterInfo = data.info;
      $scope.clusterVersion = data.version;
      $scope.clusterNodes = data.nodes;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve cluster information');
    });
  }

  StoridgeManager.init()
  .then(function success() {
    initView();
  })
  .catch(function error(err) {
    Notifications.error('Failure', err, 'Unable to communicate with Storidge API');
  });
}]);
