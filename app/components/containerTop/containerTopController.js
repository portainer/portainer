angular.module('containerTop', [])
    .controller('ContainerTopController', ['$scope', '$routeParams', 'ContainerTop', 'Container', 'ViewSpinner', function ($scope, $routeParams, ContainerTop, Container, ViewSpinner) {
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

        Container.get({id: $routeParams.id}, function (d) {
            $scope.containerName = d.Name.substring(1);
        }, function (e) {
            Messages.error("Failure", e.data);
        });

        $scope.getTop();
    }]);