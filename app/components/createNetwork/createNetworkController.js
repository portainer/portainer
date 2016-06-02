angular.module('createNetwork', [])
.controller('CreateNetworkController', ['$scope', '$state', 'Messages', 'Network', 'ViewSpinner', 'errorMsgFilter',
function ($scope, $state, Messages, Network, ViewSpinner, errorMsgFilter) {
  $scope.template = 'app/components/createNetwork/createNetwork.html';

  $scope.init = function () {
    $scope.createNetworkConfig = {
      "Name": '',
      "Driver": '',
      "IPAM": {
        "Config": [{}]
      }
    };
  };

  $scope.init();

  $scope.createNetwork = function addNetwork(createNetworkConfig) {
    if (_.isEmpty(createNetworkConfig.IPAM.Config[0])) {
      delete createNetworkConfig.IPAM;
    }
    $('#error-message').hide();
    ViewSpinner.spin();
    $('#create-network-modal').modal('hide');
    Network.create(createNetworkConfig, function (d) {
      if (d.Id) {
        Messages.send("Network created", d.Id);
      } else {
        Messages.error('Failure', errorMsgFilter(d));
      }
      ViewSpinner.stop();
      $scope.init();
      $state.go('networks', {}, {reload: true});
    }, function (e) {
      ViewSpinner.stop();
      $scope.error = "Cannot pull image " + imageName + " Reason: " + e.data;
      $('#create-network-modal').modal('show');
      $('#error-message').show();
    });
  };
}]);
