angular.module('createVolume', [])
.controller('CreateVolumeController', ['$scope', '$state', 'Volume', 'Messages', 'ViewSpinner', 'errorMsgFilter',
function ($scope, $state, Volume, Messages, ViewSpinner, errorMsgFilter) {

  $scope.formValues = {
    DriverOptions: []
  };

  $scope.config = {
    Driver: 'local'
  };

  $scope.addDriverOption = function() {
    $scope.formValues.DriverOptions.push({ name: '', value: '' });
  };

  $scope.removeDriverOption = function(index) {
    $scope.formValues.DriverOptions.splice(index, 1);
  };

  function createVolume(config) {
    ViewSpinner.spin();
    Volume.create(config, function (d) {
      if (d.Name) {
        Messages.send("Volume created", d.Name);
        ViewSpinner.stop();
        $state.go('volumes', {}, {reload: true});
      } else {
        ViewSpinner.stop();
        Messages.error('Unable to create volume', errorMsgFilter(d));
      }
    }, function (e) {
      ViewSpinner.stop();
      Messages.error('Unable to create volume', e.data);
    });
  }

  function prepareDriverOptions(config) {
    var options = {};
    $scope.formValues.DriverOptions.forEach(function (option) {
      options[option.name] = option.value;
    });
    config.DriverOpts = options;
  }

  function prepareConfiguration() {
    var config = angular.copy($scope.config);
    prepareDriverOptions(config);
    return config;
  }

  $scope.create = function () {
    var config = prepareConfiguration();
    createVolume(config);
  };
}]);
