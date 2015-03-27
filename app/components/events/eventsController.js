angular.module('events', [])
    .controller('EventsController', ['Settings', '$scope', function(Settings, $scope) {
        $scope.updateEvents = function() {
            $scope.dockerEvents = [];

            // TODO: Clean up URL building
            var url = Settings.url + '/events?';

            if ($scope.model.since) {
                var sinceSecs = Math.floor($scope.model.since.getTime() / 1000);
                url += 'since=' + sinceSecs + '&';
            }
            if ($scope.model.until) {
                var untilSecs = Math.floor($scope.model.until.getTime() / 1000);
                url += 'until=' + untilSecs;
            }

            oboe(url)
                .done(function(node) {
                    $scope.dockerEvents.push(node);
                    $scope.$apply();
                });
        };

        // Init
        $scope.model = {};
        $scope.model.since = new Date(Date.now() - 86400000); // 24 hours in the past
        $scope.model.until = new Date();
        $scope.updateEvents();

    }]);