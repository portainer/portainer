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
    $scope.availableDrivers = ['local', 'local-persist'];
    $scope.selectedDriver = { value: $scope.availableDrivers[0] };
  };

  $scope.init();

  $scope.addVolume = function addVolume(createVolumeConfig) {
    $('#error-message').hide();
    ViewSpinner.spin();
    $('#create-volume-modal').modal('hide');
    createVolumeConfig.Driver = $scope.selectedDriver.value;
    console.log(JSON.stringify(createVolumeConfig, null, 4));
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
}]);
