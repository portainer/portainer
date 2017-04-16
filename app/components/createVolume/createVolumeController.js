angular.module('createVolume', [])
.controller('CreateVolumeController', ['$scope', '$state', 'VolumeService', 'InfoService', 'ResourceControlService', 'Authentication', 'Notifications',
function ($scope, $state, VolumeService, InfoService, ResourceControlService, Authentication, Notifications) {

  $scope.formValues = {
    Ownership: $scope.applicationState.application.authentication ? 'private' : '',
    Driver: 'local',
    DriverOptions: []
  };
  $scope.availableVolumeDrivers = [];

  $scope.addDriverOption = function() {
    $scope.formValues.DriverOptions.push({ name: '', value: '' });
  };

  $scope.removeDriverOption = function(index) {
    $scope.formValues.DriverOptions.splice(index, 1);
  };

  $scope.create = function () {
    $('#createVolumeSpinner').show();

    var name = $scope.formValues.Name;
    var driver = $scope.formValues.Driver;
    var driverOptions = $scope.formValues.DriverOptions;
    var volumeConfiguration = VolumeService.createVolumeConfiguration(name, driver, driverOptions);

    VolumeService.createVolume(volumeConfiguration)
    .then(function success(data) {
      if ($scope.formValues.Ownership === 'private') {
        ResourceControlService.setVolumeResourceControl(Authentication.getUserDetails().ID, data.Name)
        .then(function success() {
          Notifications.success("Volume created", data.Name);
          $state.go('volumes', {}, {reload: true});
        })
        .catch(function error(err) {
          Notifications.error("Failure", err, 'Unable to apply resource control on volume');
        });
      } else {
        Notifications.success("Volume created", data.Name);
        $state.go('volumes', {}, {reload: true});
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create volume');
    })
    .finally(function final() {
      $('#createVolumeSpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    InfoService.getVolumePlugins()
    .then(function success(data) {
      $scope.availableVolumeDrivers = data;
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, 'Unable to retrieve volume plugin information');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
