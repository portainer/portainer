angular.module('networks', []).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/networks', {
        templateUrl: 'app/components/networks/networks.html',
        controller: 'NetworksController'
    });
}]).controller('NetworksController', ['$scope', 'Network', 'ViewSpinner', 'Messages',
    function ($scope, Network, ViewSpinner, Messages) {
        $scope.toggle = false;
        //$scope.predicate = '-Created';

        $scope.removeAction = function () {
            ViewSpinner.spin();
            var counter = 0;
            var complete = function () {
                counter = counter - 1;
                if (counter === 0) {
                    ViewSpinner.stop();
                }
            };
            angular.forEach($scope.networks, function (network) {
                if (network.Checked) {
                    counter = counter + 1;
                    Network.remove({id: network.Id}, function (d) {
                        Messages.send("Network deleted", resource.Deleted);
                        var index = $scope.networks.indexOf(network);
                        $scope.networks.splice(index, 1);
                        complete();
                    }, function (e) {
                        Messages.error("Failure", e.data);
                        complete();
                    });
                }
            });
        };

        $scope.toggleSelectAll = function () {
            angular.forEach($scope.images, function (i) {
                i.Checked = $scope.toggle;
            });
        };

        ViewSpinner.spin();
        Network.query({}, function (d) {
            $scope.networks = d;
            ViewSpinner.stop();
        }, function (e) {
            Messages.error("Failure", e.data);
            ViewSpinner.stop();
        });
    }]);
