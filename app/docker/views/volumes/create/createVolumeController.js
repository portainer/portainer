import { AccessControlFormData } from '../../../../portainer/components/accessControlForm/porAccessControlFormModel';
import { VolumesNFSFormData } from '../../../components/volumesNFSForm/volumesNFSFormModel';

angular.module('portainer.docker')
.controller('CreateVolumeController', ['$q', '$scope', '$state', 'VolumeService', 'PluginService', 'ResourceControlService', 'Authentication', 'Notifications', 'FormValidator', 'HttpRequestHelper',
function ($q, $scope, $state, VolumeService, PluginService, ResourceControlService, Authentication, Notifications, FormValidator, HttpRequestHelper) {

  $scope.formValues = {
    Driver: 'local',
    DriverOptions: [],
    AccessControlData: new AccessControlFormData(),
    NodeName: null,
    NFSData: new VolumesNFSFormData()
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

  function prepareNFSConfiguration(driverOptions) {
    var data = $scope.formValues.NFSData;

    driverOptions.push({ name: 'type', value: data.version.toLowerCase() });

    var options = 'addr=' + data.serverAddress + ',' + data.options;
    driverOptions.push({ name: 'o', value: options });

    var mountPoint = data.mountPoint[0] === ':' ? data.mountPoint : ':' + data.mountPoint;
    driverOptions.push({ name: 'device', value: mountPoint });
  }

  $scope.create = function () {
    var name = $scope.formValues.Name;
    var driver = $scope.formValues.Driver;
    var driverOptions = $scope.formValues.DriverOptions;
    var storidgeProfile = $scope.formValues.StoridgeProfile;

    if (driver === 'cio:latest' && storidgeProfile) {
      driverOptions.push({ name: 'profile', value: storidgeProfile.Name });
    }

    if ($scope.formValues.NFSData.useNFS) {
      prepareNFSConfiguration(driverOptions);
    }

    var volumeConfiguration = VolumeService.createVolumeConfiguration(name, driver, driverOptions);
    var accessControlData = $scope.formValues.AccessControlData;
    var userDetails = Authentication.getUserDetails();
    var isAdmin = Authentication.isAdmin();

    if (!validateForm(accessControlData, isAdmin)) {
      return;
    }

    var nodeName = $scope.formValues.NodeName;
    HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);

    $scope.state.actionInProgress = true;
    VolumeService.createVolume(volumeConfiguration)
    .then(function success(data) {
      var volumeIdentifier = data.Id;
      var userId = userDetails.ID;
      return ResourceControlService.applyResourceControl('volume', volumeIdentifier, userId, accessControlData, []);
    })
    .then(function success() {
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
    var apiVersion = $scope.applicationState.endpoint.apiVersion;
    var endpointProvider = $scope.applicationState.endpoint.mode.provider;

    PluginService.volumePlugins(apiVersion < 1.25 || endpointProvider === 'VMWARE_VIC')
    .then(function success(data) {
      $scope.availableVolumeDrivers = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve volume drivers');
    });
  }

  initView();
}]);
