angular.module('createConfig', [])
.controller('CreateConfigController', ['$scope', '$state', 'Notifications', 'ConfigService', 'LabelHelper', 'Authentication', 'ResourceControlService', 'FormValidator',
function ($scope, $state, Notifications, ConfigService, LabelHelper, Authentication, ResourceControlService, FormValidator) {

  $scope.formValues = {
    Name: '',
    Data: '',
    Labels: [],
    encodeConfig: true,
    AccessControlData: new AccessControlFormData()
  };

  $scope.state = {
    formValidationError: ''
  };

  $scope.addLabel = function() {
    $scope.formValues.Labels.push({ key: '', value: ''});
  };

  $scope.removeLabel = function(index) {
    $scope.formValues.Labels.splice(index, 1);
  };

  function prepareLabelsConfig(config) {
    config.Labels = LabelHelper.fromKeyValueToLabelHash($scope.formValues.Labels);
  }

  function prepareConfigData(config) {
    // Nothing to prepare for configs?
    //config.Data = $scope.formValues.Data;
    if ($scope.formValues.encodeConfig) {
      config.Data = btoa(unescape(encodeURIComponent($scope.formValues.Data)));
    } else {
      config.Data = $scope.formValues.Data;
    }
  }

  function prepareConfiguration() {
    var config = {};
    config.Name = $scope.formValues.Name;
    prepareConfigData(config);
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
    $('#createResourceSpinner').show();

    var accessControlData = $scope.formValues.AccessControlData;
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true : false;

    if (!validateForm(accessControlData, isAdmin)) {
      $('#createResourceSpinner').hide();
      return;
    }

    var configConfiguration = prepareConfiguration();
    ConfigService.create(configConfiguration)
    .then(function success(data) {
      var configIdentifier = data.ID;
      var userId = userDetails.ID;
      return ResourceControlService.applyResourceControl('config', configIdentifier, userId, accessControlData, []);
    })
    .then(function success() {
      Notifications.success('Config successfully created');
      $state.go('configs', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create config');
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });
  };
}]);
