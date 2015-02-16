angular.module('containerLogs', [])
.controller('ContainerLogsController', ['$scope', '$routeParams', '$location', '$anchorScroll', 'ContainerLogs', 'Container', 'ViewSpinner',
function($scope, $routeParams, $location, $anchorScroll, ContainerLogs, Container, ViewSpinner) {
    $scope.stdout = '';
    $scope.stderr = '';
    $scope.showTimestamps = false;
    $scope.tailLines = 2000;

    ViewSpinner.spin();
    Container.get({id: $routeParams.id}, function(d) {
        $scope.container = d;
        ViewSpinner.stop();
    }, function(e) {
        if (e.status === 404) {
            Messages.error("Not found", "Container not found.");
        } else {
            Messages.error("Failure", e.data);
        }
        ViewSpinner.stop();
    });

    function getLogs() {
        ContainerLogs.get($routeParams.id, {
            stdout: 1,
            stderr: 0,
            timestamps: $scope.showTimestamps,
            tail: $scope.tailLines
        }, function(data, status, headers, config) {
            // Replace carriage returns twith newlines to clean up output
            $scope.stdout = data.replace(/[\r]/g, '\n');
        });
        ContainerLogs.get($routeParams.id, {
            stdout: 0,
            stderr: 1,
            timestamps: $scope.showTimestamps,
            tail: $scope.tailLines
        }, function(data, status, headers, config) {
            $scope.stderr = data.replace(/[\r]/g, '\n');
        });
    }

    // initial call
    getLogs();
    var logIntervalId = window.setInterval(getLogs, 5000);

    $scope.$on("$destroy", function(){
        // clearing interval when view changes
        clearInterval(logIntervalId);
    });

    $scope.scrollTo = function(id) {
        $location.hash(id);
        $anchorScroll();
    };

    $scope.toggleTimestamps = function() {
        getLogs();
    };

    $scope.toggleTail = function() {
        getLogs();
    };
}]);
