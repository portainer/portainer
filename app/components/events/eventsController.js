angular.module('events', [])
.controller('EventsController', ['$scope', 'Settings', 'Messages', 'Events',
function ($scope, Settings, Messages, Events) {
  $scope.state = {};
  $scope.sortType = 'Time';
  $scope.sortReverse = true;

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  var from = moment().subtract(24, 'hour').unix();
  var to = moment().unix();

  Events.query({since: from, until: to},
  function(d) {
    $scope.events = d.map(function (item) {
      return new EventViewModel(item);
    });
    $('#loadEventsSpinner').hide();
  },
  function (e) {
    $('#loadEventsSpinner').hide();
    Messages.error("Failure", e, "Unable to load events");
  });
}]);
