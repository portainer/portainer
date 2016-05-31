angular.module('createVolume', [])
.controller('CreateVolumeController', ['$scope', '$state', 'Messages', 'Volume', 'ViewSpinner', 'errorMsgFilter',
function ($scope, $state, Messages, Volume, ViewSpinner, errorMsgFilter) {
  $scope.template = 'app/components/createVolume/createVolume.html';

  $scope.init = function () {
    $scope.createVolumeConfig = {
      "Name": "",
      "Driver": "",
      "DriverOpts": {}
    };
    $scope.driverOptions = [];
  };

  $scope.init();

  $scope.addOption = function() {
    $scope.driverOptions.push({});
  };

  $scope.removeOption = function(entry) {
    var idx = $scope.driverOptions.indexOf(entry);
    $scope.driverOptions.splice(idx, 1);
  };

  $scope.addVolume = function addVolume(createVolumeConfig) {
    $('#error-message').hide();
    ViewSpinner.spin();
    $('#create-volume-modal').modal('hide');
    assignOptions(createVolumeConfig);
    Volume.create(createVolumeConfig, function (d) {
      if (d.Name) {
        Messages.send("Volume created", d.Name);
      } else {
        Messages.error('Failure', errorMsgFilter(d));
      }
      ViewSpinner.stop();
      $state.go('volumes', {}, {reload: true});
    }, function (e) {
      ViewSpinner.stop();
      $scope.error = "Cannot create volume " + createVolumeConfig.Name + " Reason: " + e.data;
      $('#create-volume-modal').modal('show');
      $('#error-message').show();
    });
  };

  function assignOptions(createVolumeConfig) {
    createVolumeConfig.DriverOpts = {};
    angular.forEach($scope.driverOptions, function (option) {
      createVolumeConfig.DriverOpts[option.name] = option.value;
    });
  }
}]);
