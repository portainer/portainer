angular.module('extension.storidge')
.controller('StoridgeClusterController', ['$q', '$scope', '$state', '$document', 'Notifications', 'Pagination', 'StoridgeClusterService', 'StoridgeNodeService', 'StoridgeChartService', 'ModalService',
function ($q, $scope, $state, $document, Notifications, Pagination, StoridgeClusterService, StoridgeNodeService, StoridgeChartService, ModalService) {

  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('storidge_nodes');
  $scope.sortType = 'Name';
  $scope.sortReverse = true;

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('storidge_nodes', $scope.state.pagination_count);
  };

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
    Notifications.error('Not implemented', {}, 'Not implemented yet');
    $state.reload();
  }

  function rebootCluster() {
    $('#clusterActionSpinner').show();

    StoridgeClusterService.reboot()
    .then(function success(data) {
      Notifications.success('Cluster successfully rebooted');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to reboot cluster');
    })
    .finally(function final() {
      $('#clusterActionSpinner').show();
    });
  }

  function updateCapacityChart(info, chart) {
    var usedCapacity = info.UsedCapacity;
    var freeCapacity = info.FreeCapacity;

    StoridgeChartService.UpdateChart('Free', freeCapacity, chart);
    StoridgeChartService.UpdateChart('Used', usedCapacity, chart);
  }

  function initCharts() {
    var capacityChartCtx = $('#capacityChart');
    var capacityChart = StoridgeChartService.CreateCapacityChart(capacityChartCtx);

    $q.all({
      info: StoridgeClusterService.info(),
      version: StoridgeClusterService.version(),
      nodes: StoridgeNodeService.nodes()
    })
    .then(function success(data) {
      var info = data.info;
      $scope.clusterInfo = info;
      $scope.clusterVersion = data.version;
      updateCapacityChart(info, capacityChart);
      $scope.clusterNodes = data.nodes;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve cluster information');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  function initView() {
    $('#loadingViewSpinner').show();
    $document.ready(function() {
      initCharts();
    });
  }

  initView();
}]);
