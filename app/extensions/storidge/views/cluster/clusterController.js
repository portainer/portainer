angular.module('extension.storidge')
.controller('StoridgeClusterController', ['$q', '$scope', '$state', 'Notifications', 'Pagination', 'StoridgeClusterService', 'StoridgeNodeService', 'ModalService',
function ($q, $scope, $state, Notifications, Pagination, StoridgeClusterService, StoridgeNodeService, ModalService) {

  $scope.rebootCluster = function() {
    ModalService.confirm({
      title: 'Are you sure?',
      message: 'Do you want to reboot the Storidge cluster?',
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
      message: 'Do you want to shutdown the Storidge cluster?',
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
    Notifications.success('Cluster successfully shutdown');
    $state.reload();
  }

  function rebootCluster() {
    $('#loadingViewSpinner').show();

    StoridgeClusterService.reboot()
    .then(function success(data) {
      Notifications.success('Cluster successfully rebooted');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to reboot cluster');
    })
    .finally(function final() {
      $('#loadingViewSpinner').show();
    });
  }

  function initView() {
    $('#loadingViewSpinner').show();

    $q.all({
      info: StoridgeClusterService.info(),
      version: StoridgeClusterService.version()
    })
    .then(function success(data) {
      $scope.clusterInfo = data.info;
      $scope.clusterVersion = data.version;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve cluster information');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
