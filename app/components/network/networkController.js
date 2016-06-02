angular.module('network', []).config(['$routeProvider', function ($routeProvider) {
}]).controller('NetworkController', ['$scope', 'Network', 'ViewSpinner', 'Messages', '$state', '$stateParams', 'errorMsgFilter',
function ($scope, Network, ViewSpinner, Messages, $state, $stateParams, errorMsgFilter) {

  $scope.disconnect = function disconnect(networkId, containerId) {
    ViewSpinner.spin();
    Network.disconnect({id: $stateParams.id}, {Container: containerId}, function (d) {
      ViewSpinner.stop();
      Messages.send("Container disconnected", containerId);
      $state.go('network', {id: $stateParams.id}, {reload: true});
    }, function (e) {
      ViewSpinner.stop();
      Messages.error("Failure", e.data);
    });
  };

  $scope.remove = function remove(networkId) {
    ViewSpinner.spin();
    Network.remove({id: $stateParams.id}, function (d) {
      ViewSpinner.stop();
      Messages.send("Network removed", "");
      $state.go('networks', {});
    }, function (e) {
      ViewSpinner.stop();
      Messages.error("Failure", e.data);
    });
  };

  ViewSpinner.spin();
  Network.get({id: $stateParams.id}, function (d) {
    $scope.network = d;
    ViewSpinner.stop();
  }, function (e) {
    Messages.error("Failure", e.data);
    ViewSpinner.stop();
  });
}]);
