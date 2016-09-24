angular.module('network', [])
.controller('NetworkController', ['$scope', '$state', '$stateParams', 'Network', 'Messages',
function ($scope, $state, $stateParams, Network, Messages) {

  $scope.removeNetwork = function removeNetwork(networkId) {
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
