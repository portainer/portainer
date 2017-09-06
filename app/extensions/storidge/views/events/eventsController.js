angular.module('extension.storidge')
.controller('StoridgeEventsController', ['$scope', 'Notifications', 'Pagination', 'StoridgeClusterService', 'ModalService',
function ($scope, Notifications, Pagination, StoridgeClusterService, ModalService) {

  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('storidge_events');
  $scope.sortType = 'Time';
  $scope.sortReverse = true;

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('storidge_events', $scope.state.pagination_count);
  };

  function initView() {
    $('#loadingViewSpinner').show();

    StoridgeClusterService.events()
    .then(function success(data) {
      $scope.events = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve Storidge events');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
