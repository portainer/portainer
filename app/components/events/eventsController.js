angular.module('events', [])
.controller('EventsController', ['$scope', 'Notifications', 'SystemService', 'PaginationService',
function ($scope, Notifications, SystemService, PaginationService) {
  // $scope.state = {};
  // $scope.state.pagination_count = PaginationService.getPaginationCount('events');
  // $scope.sortType = 'Time';
  // $scope.sortReverse = true;

  // $scope.order = function(sortType) {
  //   $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
  //   $scope.sortType = sortType;
  // };
  //
  // $scope.changePaginationCount = function() {
  //   PaginationService.setPaginationCount('events', $scope.state.pagination_count);
  // };

  function initView() {
    var from = moment().subtract(24, 'hour').unix();
    var to = moment().unix();

    SystemService.events(from, to)
    .then(function success(data) {
      $scope.events = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to load events');
    });
  }

  initView();
}]);
