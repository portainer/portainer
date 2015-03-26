angular.module('events', [])
.controller('EventsController', ['Settings', '$scope', function(Settings, $scope) {
	var yesterday = Math.floor(Date.now() / 1000) - 86400; // Today's date minus 24 hours.
	$scope.dockerEvents = [];
	oboe(Settings.url + '/events' + '?since=' + yesterday)
      .done(function(node) {
         $scope.dockerEvents.push(node);
         $scope.$apply();
      });
}]);
