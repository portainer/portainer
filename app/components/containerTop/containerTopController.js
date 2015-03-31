angular.module('containerTop', [])
    .controller('ContainerTopController', ['$scope', '$routeParams', 'ContainerTop', 'ViewSpinner', function ($scope, $routeParams, ContainerTop, ViewSpinner) {
        $scope.ps_args = '';

        /**
         * Get container processes
         */
        $scope.getTop = function () {
            ViewSpinner.spin();
            ContainerTop.get($routeParams.id, {
                ps_args: $scope.ps_args
            }, function (data) {
                $scope.containerTop = data;
                ViewSpinner.stop();
            });
        };

        $scope.getTop();
    }]);