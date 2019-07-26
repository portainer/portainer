angular.module('portainer.integrations.storidge')
.controller('StoridgeClusterController', ['$q', '$scope', '$state', 'Notifications', 'StoridgeClusterService', 'StoridgeNodeService', 'ModalService',
function ($q, $scope, $state, Notifications, StoridgeClusterService, StoridgeNodeService, ModalService) {

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

  initView();
}]);
