angular.module('portainer.docker')
.controller('CreateNetworkController', ['$q', '$scope', '$state', 'PluginService', 'Notifications', 'NetworkService', 'LabelHelper', 'Authentication', 'ResourceControlService', 'FormValidator',
function ($q, $scope, $state, PluginService, Notifications, NetworkService, LabelHelper, Authentication, ResourceControlService, FormValidator) {

  $scope.formValues = {
    DriverOptions: [],
    Subnet: '',
    Gateway: '',
    Labels: [],
    AccessControlData: new AccessControlFormData()
  };

  $scope.state = {
    formValidationError: '',
    actionInProgress: false
  };

  $scope.availableNetworkDrivers = [];

  $scope.config = {
    Driver: 'bridge',
    CheckDuplicate: true,
    Internal: false,
    // Force IPAM Driver to 'default', should not be required.
    // See: https://github.com/docker/docker/issues/25735
    IPAM: {
      Driver: 'default',
      Config: []
    },
    Labels: {}
  };

  $scope.addDriverOption = function() {
    $scope.formValues.DriverOptions.push({ name: '', value: '' });
  };

  $scope.removeDriverOption = function(index) {
    $scope.formValues.DriverOptions.splice(index, 1);
  };

  $scope.addLabel = function() {
    $scope.formValues.Labels.push({ key: '', value: ''});
  };

  $scope.removeLabel = function(index) {
    $scope.formValues.Labels.splice(index, 1);
  };

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

  function prepareLabelsConfig(config) {
    config.Labels = LabelHelper.fromKeyValueToLabelHash($scope.formValues.Labels);
  }

  function prepareConfiguration() {
    var config = angular.copy($scope.config);
    prepareIPAMConfiguration(config);
    prepareDriverOptions(config);
    prepareLabelsConfig(config);
    return config;
  }

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
    var networkConfiguration = prepareConfiguration();
    var accessControlData = $scope.formValues.AccessControlData;
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1;

    if (!validateForm(accessControlData, isAdmin)) {
      return;
    }

    $scope.state.actionInProgress = true;
    NetworkService.create(networkConfiguration)
    .then(function success(data) {
      var networkIdentifier = data.Id;
      var userId = userDetails.ID;
      return ResourceControlService.applyResourceControl('network', networkIdentifier, userId, accessControlData, []);
    })
    .then(function success() {
      Notifications.success('Network successfully created');
      $state.go('docker.networks', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'An error occured during network creation');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  function initView() {
    var endpointProvider = $scope.applicationState.endpoint.mode.provider;
    var apiVersion = $scope.applicationState.endpoint.apiVersion;
    if(endpointProvider !== 'DOCKER_SWARM') {
      PluginService.networkPlugins(apiVersion < 1.25)
      .then(function success(data){
          $scope.availableNetworkDrivers = data;
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve network drivers');
      });
    }
  }

  initView();
}]);
