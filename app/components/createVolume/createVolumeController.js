angular.module('createVolume', [])
.controller('CreateVolumeController', ['$scope', '$state', 'VolumeService', 'InfoService', 'ResourceControlService', 'Authentication', 'Notifications', 'ControllerDataPipeline', 'FormValidator',
function ($scope, $state, VolumeService, InfoService, ResourceControlService, Authentication, Notifications, ControllerDataPipeline, FormValidator) {

  $scope.formValues = {
    Driver: 'local',
    DriverOptions: []
  };

  $scope.state = {
    formValidationError: ''
  };

  $scope.availableVolumeDrivers = [];

  $scope.addDriverOption = function() {
    $scope.formValues.DriverOptions.push({ name: '', value: '' });
  };

  $scope.removeDriverOption = function(index) {
    $scope.formValues.DriverOptions.splice(index, 1);
  };

  function validateForm(accessControlData, isAdmin) {
    $scope.state.formValidationError = '';
    var error = '';
    error = FormValidator.validateAccessControl(accessControlData, isAdmin);

    if (error) {
      $scope.state.formValidationError = error;
      return false;
    }
    return true;
  }

  $scope.create = function () {
    $('#createVolumeSpinner').show();

    var name = $scope.formValues.Name;
    var driver = $scope.formValues.Driver;
    var driverOptions = $scope.formValues.DriverOptions;
    var volumeConfiguration = VolumeService.createVolumeConfiguration(name, driver, driverOptions);
    var userDetails = Authentication.getUserDetails();
    var accessControlData = ControllerDataPipeline.getAccessControlFormData();
    var isAdmin = userDetails.role === 1 ? true : false;

    if (!validateForm(accessControlData, isAdmin)) {
      $('#createVolumeSpinner').hide();
      return;
    }

    VolumeService.createVolume(volumeConfiguration)
    .then(function success(data) {
      var volumeIdentifier = data.Name;
      var userId = userDetails.ID;
      return ResourceControlService.applyResourceControl('volume', volumeIdentifier, userId, accessControlData);
    })
    .then(function success(data) {
      Notifications.success('Volume successfully created');
      $state.go('volumes', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'An error occured during volume creation');
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
      Notifications.error('Failure', err, 'Unable to retrieve volume drivers');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
