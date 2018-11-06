import _ from 'lodash';
import { AccessControlFormData } from '../../../../portainer/components/accessControlForm/porAccessControlFormModel';

angular.module('portainer.docker')
.controller('CreateConfigController', ['$scope', '$state', '$transition$', 'Notifications', 'ConfigService', 'Authentication', 'FormValidator', 'ResourceControlService',
function ($scope, $state, $transition$, Notifications, ConfigService, Authentication, FormValidator, ResourceControlService) {
  $scope.formValues = {
    Name: '',
    Labels: [],
    AccessControlData: new AccessControlFormData(),
    ConfigContent: ''
  };

  $scope.state = {
    formValidationError: ''
  };

  $scope.addLabel = function() {
    $scope.formValues.Labels.push({ name: '', value: ''});
  };

  $scope.removeLabel = function(index) {
    $scope.formValues.Labels.splice(index, 1);
  };

  function prepareLabelsConfig(config) {
    var labels = {};
    $scope.formValues.Labels.forEach(function (label) {
      if (label.name && label.value) {
          labels[label.name] = label.value;
      }
    });
    config.Labels = labels;
  }

  function prepareConfigData(config) {
    var configData = $scope.formValues.ConfigContent;
    config.Data = btoa(unescape(encodeURIComponent(configData)));
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
    var accessControlData = $scope.formValues.AccessControlData;
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1;

    if ($scope.formValues.ConfigContent === '') {
      $scope.state.formValidationError = 'Config content must not be empty';
      return;
    }

    if (!validateForm(accessControlData, isAdmin)) {
      return;
    }

    var config = prepareConfiguration();

    ConfigService.create(config)
    .then(function success(data) {
      var configIdentifier = data.ID;
      var userId = userDetails.ID;
      return ResourceControlService.applyResourceControl('config', configIdentifier, userId, accessControlData, []);
    })
    .then(function success() {
      Notifications.success('Config successfully created');
      $state.go('docker.configs', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create config');
    });
  };

  $scope.editorUpdate = function(cm) {
    $scope.formValues.ConfigContent = cm.getValue();
  };

  function initView() {
    if (!$transition$.params().id) {
        $scope.formValues.displayCodeEditor = true;
        return;
    }

    ConfigService.config($transition$.params().id)
    .then(function success(data) {
      $scope.formValues.Name = data.Name + '_copy';
      $scope.formValues.Data = data.Data;
      var labels = _.keys(data.Labels);
      for (var i = 0; i < labels.length; i++) {
        var labelName = labels[i];
        var labelValue = data.Labels[labelName];
        $scope.formValues.Labels.push({ name: labelName, value: labelValue});
      }
      $scope.formValues.displayCodeEditor = true;
    })
    .catch(function error(err) {
      $scope.formValues.displayCodeEditor = true;
      Notifications.error('Failure', err, 'Unable to clone config');
    });
  }

  initView();
}]);
