import { AccessControlFormData } from '../../../../portainer/components/accessControlForm/porAccessControlFormModel';

angular.module('portainer.docker').controller('CreateSecretController', [
  '$scope',
  '$state',
  'Notifications',
  'SecretService',
  'LabelHelper',
  'Authentication',
  'ResourceControlService',
  'FormValidator',
  function ($scope, $state, Notifications, SecretService, LabelHelper, Authentication, ResourceControlService, FormValidator) {
    $scope.formValues = {
      Name: '',
      Data: '',
      Labels: [],
      encodeSecret: true,
      AccessControlData: new AccessControlFormData(),
    };

    $scope.state = {
      formValidationError: '',
      actionInProgress: false,
    };

    $scope.addLabel = function () {
      $scope.formValues.Labels.push({ key: '', value: '' });
    };

    $scope.removeLabel = function (index) {
      $scope.formValues.Labels.splice(index, 1);
    };

    function prepareLabelsConfig(config) {
      config.Labels = LabelHelper.fromKeyValueToLabelHash($scope.formValues.Labels);
    }

    function prepareSecretData(config) {
      if ($scope.formValues.encodeSecret) {
        config.Data = btoa(unescape(encodeURIComponent($scope.formValues.Data)));
      } else {
        config.Data = $scope.formValues.Data;
      }
    }

    function prepareConfiguration() {
      var config = {};
      config.Name = $scope.formValues.Name;
      prepareSecretData(config);
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
      const accessControlData = $scope.formValues.AccessControlData;
      const userDetails = Authentication.getUserDetails();
      const isAdmin = Authentication.isAdmin();

      if (!validateForm(accessControlData, isAdmin)) {
        return;
      }

      $scope.state.actionInProgress = true;
      var secretConfiguration = prepareConfiguration();
      SecretService.create(secretConfiguration)
        .then(function success(data) {
          const userId = userDetails.ID;
          const resourceControl = data.Portainer.ResourceControl;
          return ResourceControlService.applyResourceControl(userId, accessControlData, resourceControl);
        })
        .then(function success() {
          Notifications.success('Secret successfully created');
          $state.go('docker.secrets', {}, { reload: true });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to create secret');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };
  },
]);
