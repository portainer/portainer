angular.module('portainer.docker')
.controller('CreateVolumeController', ['$q', '$scope', '$state', 'VolumeService', 'PluginService', 'ResourceControlService', 'Authentication', 'Notifications', 'FormValidator',
function ($q, $scope, $state, VolumeService, PluginService, ResourceControlService, Authentication, Notifications, FormValidator) {

  $scope.formValues = {
    Driver: 'local',
    DriverOptions: [],
    AccessControlData: new AccessControlFormData()
  };

  $scope.state = {
    formValidationError: '',
    actionInProgress: false
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

    var name = $scope.formValues.Name;
    var driver = $scope.formValues.Driver;
    var driverOptions = $scope.formValues.DriverOptions;
    var storidgeProfile = $scope.formValues.StoridgeProfile;

    if (driver === 'cio:latest' && storidgeProfile) {
      driverOptions.push({ name: 'profile', value: storidgeProfile.Name });
    }

    var volumeConfiguration = VolumeService.createVolumeConfiguration(name, driver, driverOptions);
    var accessControlData = $scope.formValues.AccessControlData;
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1;

    if (!validateForm(accessControlData, isAdmin)) {
      return;
    }

    $scope.state.actionInProgress = true;
    VolumeService.createVolume(volumeConfiguration)
    .then(function success(data) {
      var volumeIdentifier = data.Id;
      var userId = userDetails.ID;
      return ResourceControlService.applyResourceControl('volume', volumeIdentifier, userId, accessControlData, []);
    })
    .then(function success(data) {
      Notifications.success('Volume successfully created');
      $state.go('docker.volumes', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'An error occured during volume creation');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  function initView() {
    var endpointProvider = $scope.applicationState.endpoint.mode.provider;
    var apiVersion = $scope.applicationState.endpoint.apiVersion;
    if (endpointProvider !== 'DOCKER_SWARM') {
      PluginService.volumePlugins(apiVersion < 1.25 || endpointProvider === 'VMWARE_VIC')
      .then(function success(data) {
        $scope.availableVolumeDrivers = data;
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve volume drivers');
      });
    }
  }

  initView();
}]);
