angular.module('createNetwork', [])
.controller('CreateNetworkController', ['$scope', '$state', 'Messages', 'Network',
function ($scope, $state, Messages, Network) {
  $scope.formValues = {
    DriverOptions: [],
    Subnet: '',
    Gateway: ''
  };

  $scope.config = {
    Driver: 'bridge',
    CheckDuplicate: true,
    Internal: false,
    IPAM: {
      Config: []
    }
  };

  $scope.addDriverOption = function() {
    $scope.formValues.DriverOptions.push({ name: '', value: '' });
  };

  $scope.removeDriverOption = function(index) {
    $scope.formValues.DriverOptions.splice(index, 1);
  };

  function createNetwork(config) {
    $('#createNetworkSpinner').show();
    Network.create(config, function (d) {
      if (d.message) {
        $('#createNetworkSpinner').hide();
        Messages.error('Unable to create network', {}, d.message);
      } else {
        Messages.send("Network created", d.Id);
        $('#createNetworkSpinner').hide();
        $state.go('networks', {}, {reload: true});
      }
    }, function (e) {
      $('#createNetworkSpinner').hide();
      Messages.error("Failure", e, 'Unable to create network');
    });
  }

  function prepareIPAMConfiguration(config) {
    if ($scope.formValues.Subnet) {
      var ipamConfig = {};
      ipamConfig.Subnet = $scope.formValues.Subnet;
      if ($scope.formValues.Gateway) {
        ipamConfig.Gateway = $scope.formValues.Gateway  ;
      }
      config.IPAM.Config.push(ipamConfig);
    }
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
    prepareIPAMConfiguration(config);
    prepareDriverOptions(config);
    return config;
  }

  $scope.create = function () {
    var config = prepareConfiguration();
    createNetwork(config);
  };
}]);
