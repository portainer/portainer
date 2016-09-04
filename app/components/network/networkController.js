angular.module('network', [])
.controller('NetworkController', ['$scope', 'Network', 'Messages', '$state', '$stateParams',
function ($scope, Network, Messages, $state, $stateParams) {

  $scope.disconnect = function disconnect(networkId, containerId) {
    $('#loadingViewSpinner').show();
    Network.disconnect({id: $stateParams.id}, {Container: containerId}, function (d) {
      $('#loadingViewSpinner').hide();
      Messages.send("Container disconnected", containerId);
      $state.go('network', {id: $stateParams.id}, {reload: true});
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to disconnect container");
    });
  };

  $scope.remove = function remove(networkId) {
    $('#loadingViewSpinner').show();
    Network.remove({id: $stateParams.id}, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Messages.send("Error", {}, d.message);
      } else {
        $('#loadingViewSpinner').hide();
        Messages.send("Network removed", $stateParams.id);
        $state.go('networks', {});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to remove network");
    });
  };

  $('#loadingViewSpinner').show();
  Network.get({id: $stateParams.id}, function (d) {
    $scope.network = d;
    $('#loadingViewSpinner').hide();
  }, function (e) {
    $('#loadingViewSpinner').hide();
    Messages.error("Failure", e, "Unable to retrieve network info");
  });
}]);
