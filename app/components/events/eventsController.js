angular.module('events', ['ngOboe'])
    .controller('EventsController', ['Settings', '$scope', 'Oboe', 'Messages', '$timeout', function (Settings, $scope, oboe, Messages, $timeout) {
        $scope.updateEvents = function () {
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

            oboe({
                url: url,
                pattern: '{id status time}'
            })
                .then(function (node) {
                    // finished loading
                    $timeout(function () {
                        $scope.$apply();
                    });
                }, function (error) {
                    // handle errors
                    Messages.error("Failure", error.data);
                }, function (node) {
                    // node received
                    $scope.dockerEvents.push(node);
                });
        };

        // Init
        $scope.model = {};
        $scope.model.since = new Date(Date.now() - 86400000); // 24 hours in the past
        $scope.model.until = new Date();
        $scope.updateEvents();

    }]);