angular.module('networks', []).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/networks/', {
        templateUrl: 'app/components/networks/networks.html',
        controller: 'NetworksController'
    });
}]).controller('NetworksController', ['$scope', 'Network', 'ViewSpinner', 'Messages', '$route', 'errorMsgFilter',
    function ($scope, Network, ViewSpinner, Messages, $route, errorMsgFilter) {
        $scope.sortType = 'Name';
        $scope.sortReverse = true;
        $scope.toggle = false;
        $scope.order = function(sortType) {
            $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
            $scope.sortType = sortType;
        };
        $scope.createNetworkConfig = {
            "Name": '',
            "Driver": '',
            "IPAM": {
                "Config": [{
                    "Subnet": '',
                    "IPRange": '',
                    "Gateway": ''
                }]
            }
        };



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
                        Messages.send("Network deleted", network.Id);
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
            angular.forEach($scope.filteredNetworks, function (i) {
                i.Checked = $scope.toggle;
            });
        };

        $scope.addNetwork = function addNetwork(createNetworkConfig) {
            ViewSpinner.spin();
            Network.create(createNetworkConfig, function (d) {
                if (d.Id) {
                    Messages.send("Network created", d.Id);
                } else {
                    Messages.error('Failure', errorMsgFilter(d));
                }
                ViewSpinner.stop();
                fetchNetworks();
            }, function (e) {
                Messages.error("Failure", e.data);
                ViewSpinner.stop();
            });
        };

        function fetchNetworks() {
            ViewSpinner.spin();
            Network.query({}, function (d) {
                $scope.networks = d;
                ViewSpinner.stop();
            }, function (e) {
                Messages.error("Failure", e.data);
                ViewSpinner.stop();
            });
        }
        fetchNetworks();
    }]);
