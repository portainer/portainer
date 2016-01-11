angular.module('network', []).config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/networks/:id/', {
        templateUrl: 'app/components/network/network.html',
        controller: 'NetworkController'
    });
}]).controller('NetworkController', ['$scope', 'Network', 'ViewSpinner', 'Messages', '$routeParams', '$location', 'errorMsgFilter',
    function ($scope, Network, ViewSpinner, Messages, $routeParams, $location, errorMsgFilter) {

        $scope.disconnect = function disconnect(networkId, containerId) {
            ViewSpinner.spin();
            Network.disconnect({id: $routeParams.id}, {Container: containerId}, function (d) {
                ViewSpinner.stop();
                Messages.send("Container disconnected", containerId);
                $location.path('/networks/' + $routeParams.id); // Refresh the current page.
            }, function (e) {
                ViewSpinner.stop();
                Messages.error("Failure", e.data);
            });
        };
        $scope.connect = function connect(networkId, containerId) {
            ViewSpinner.spin();
            Network.connect({id: $routeParams.id}, {Container: containerId}, function (d) {
                ViewSpinner.stop();
                var errmsg = errorMsgFilter(d);
                if (errmsg) {
                    Messages.error('Error', errmsg);
                } else {
                    Messages.send("Container connected", d);
                }
                $location.path('/networks/' + $routeParams.id); // Refresh the current page.
            }, function (e) {
                ViewSpinner.stop();
                Messages.error("Failure", e.data);
            });
        };
        $scope.remove = function remove(networkId) {
            ViewSpinner.spin();
            Network.remove({id: $routeParams.id}, function (d) {
                ViewSpinner.stop();
                Messages.send("Network removed", d);
                $location.path('/networks'); // Go to the networks page
            }, function (e) {
                ViewSpinner.stop();
                Messages.error("Failure", e.data);
            });
        };

        ViewSpinner.spin();
        Network.get({id: $routeParams.id}, function (d) {
            $scope.network = d;
            ViewSpinner.stop();
        }, function (e) {
            Messages.error("Failure", e.data);
            ViewSpinner.stop();
        });
    }]);
