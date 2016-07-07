angular.module('network', [])
.controller('NetworkController', ['$scope', 'Network', 'Messages', '$state', '$stateParams', 'errorMsgFilter',
function ($scope, Network, Messages, $state, $stateParams, errorMsgFilter) {

  $scope.disconnect = function disconnect(networkId, containerId) {
    $('#loadingViewSpinner').show();
    Network.disconnect({id: $stateParams.id}, {Container: containerId}, function (d) {
      $('#loadingViewSpinner').hide();
      Messages.send("Container disconnected", containerId);
      $state.go('network', {id: $stateParams.id}, {reload: true});
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e.data);
    });
  };

  $scope.remove = function remove(networkId) {
    $('#loadingViewSpinner').show();
    Network.remove({id: $stateParams.id}, function (d) {
      $('#loadingViewSpinner').hide();
      Messages.send("Network removed", "");
      $state.go('networks', {});
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e.data);
    });
  };

  $('#loadingViewSpinner').show();
  Network.get({id: $stateParams.id}, function (d) {
    $scope.network = d;
    $('#loadingViewSpinner').hide();
  }, function (e) {
    Messages.error("Failure", e.data);
    $('#loadingViewSpinner').hide();
  });
}]);
