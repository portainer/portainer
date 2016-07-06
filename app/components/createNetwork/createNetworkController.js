angular.module('createNetwork', [])
.controller('CreateNetworkController', ['$scope', '$state', 'Messages', 'Network', 'ViewSpinner', 'errorMsgFilter',
function ($scope, $state, Messages, Network, ViewSpinner, errorMsgFilter) {
  $scope.formValues = {
    DriverOptions: []
  };

  $scope.config = {
    Driver: 'bridge',
    CheckDuplicate: true,
    Internal: false
  };

  $scope.addDriverOption = function() {
    $scope.formValues.DriverOptions.push({ name: '', value: '' });
  };

  $scope.removeDriverOption = function(index) {
    $scope.formValues.DriverOptions.splice(index, 1);
  };

  function createNetwork(config) {
    ViewSpinner.spin();
    Network.create(config, function (d) {
      if (d.Id) {
        Messages.send("Network created", d.Id);
        ViewSpinner.stop();
        $state.go('networks', {}, {reload: true});
      } else {
        ViewSpinner.stop();
        Messages.error('Unable to create network', errorMsgFilter(d));
      }
    }, function (e) {
      ViewSpinner.stop();
      Messages.error('Unable to create network', e.data);
    });
  }

  function prepareDriverOptions(config) {
    var options = {};
    $scope.formValues.DriverOptions.forEach(function (option) {
      options[option.name] = option.value;
    });
    config.Options = options;
  }

  function prepareConfiguration() {
    var config = angular.copy($scope.config);
    prepareDriverOptions(config);
    return config;
  }

  $scope.create = function () {
    var config = prepareConfiguration();
    console.log(JSON.stringify(config, null, 4));
    createNetwork(config);
  };
}]);
