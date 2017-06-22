angular.module('stacks', [])
.controller('StacksController', ['$scope', 'Notifications', 'Pagination', 'StackService',
function ($scope, Notifications, Pagination, StackService) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.pagination_count = Pagination.getPaginationCount('stacks');
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('stacks', $scope.state.pagination_count);
  };

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };
  
  function initView() {
    $('#loadingViewSpinner').show();

    var includeServices = $scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE';

    StackService.stacks(includeServices)
    .then(function success(data) {
      $scope.stacks = data;
    })
    .catch(function error(err) {
      $scope.stacks = [];
      Notifications.error('Failure', err, 'Unable to retrieve stacks');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
