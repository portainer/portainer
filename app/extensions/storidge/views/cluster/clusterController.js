angular.module('extension.storidge')
.controller('StoridgeClusterController', ['$q', '$scope', '$state', 'Notifications', 'Pagination', 'StoridgeClusterService', 'StoridgeNodeService',
function ($q, $scope, $state, Notifications, Pagination, StoridgeClusterService, StoridgeNodeService) {

  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('storidge_events');
  $scope.sortType = 'Event';
  $scope.sortReverse = true;

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('storidge_events', $scope.state.pagination_count);
  };

  $scope.rebootCluster = function() {
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
  };

  $scope.shutdownCluster = function() {
    Notifications.success('Cluster successfully shutdown');
    $state.reload();
  };

  function initView() {
    $('#loadingViewSpinner').show();

    $q.all({
      info: StoridgeClusterService.info(),
      version: StoridgeClusterService.version(),
      events: StoridgeClusterService.events()
    })
    .then(function success(data) {
      $scope.clusterInfo = data.info;
      $scope.clusterVersion = data.version;
      $scope.clusterEvents = data.events;
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
