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
        ViewSpinner.spin();
        ContainerLogs.get($routeParams.id, {
            stdout: 1,
            stderr: 0,
            timestamps: $scope.showTimestamps,
            tail: $scope.tailLines
        }, function(data, status, headers, config) {
            // Replace carriage returns with newlines to clean up output
            data = data.replace(/[\r]/g, '\n');
            // Strip 8 byte header from each line of output
            data = data.substring(8);
            data = data.replace(/\n(.{8})/g, '\n');
            $scope.stdout = data;
            ViewSpinner.stop();
        });

        ContainerLogs.get($routeParams.id, {
            stdout: 0,
            stderr: 1,
            timestamps: $scope.showTimestamps,
            tail: $scope.tailLines
        }, function(data, status, headers, config) {
            // Replace carriage returns with newlines to clean up output
            data = data.replace(/[\r]/g, '\n');
            // Strip 8 byte header from each line of output
            data = data.substring(8);
            data = data.replace(/\n(.{8})/g, '\n');
            $scope.stderr = data;
            ViewSpinner.stop();
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
