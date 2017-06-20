angular.module('events', [])
.controller('EventsController', ['$scope', 'Notifications', 'SystemService', 'Pagination',
function ($scope, Notifications, SystemService, Pagination) {
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('events');
  $scope.sortType = 'Time';
  $scope.sortReverse = true;

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('events', $scope.state.pagination_count);
  };

  function initView() {
    var from = moment().subtract(24, 'hour').unix();
    var to = moment().unix();

    $('#loadEventsSpinner').show();
    SystemService.events(from, to)
    .then(function success(data) {
      $scope.events = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to load events');
    })
    .finally(function final() {
      $('#loadEventsSpinner').hide();
    });
  }

  initView();
}]);
