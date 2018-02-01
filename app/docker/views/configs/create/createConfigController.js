angular.module('portainer.docker')
.controller('CreateConfigController', ['$scope', '$state', '$document', 'Notifications', 'ConfigService', 'Authentication', 'FormValidator', 'ResourceControlService', 'CodeMirrorService',
function ($scope, $state, $document, Notifications, ConfigService, Authentication, FormValidator, ResourceControlService, CodeMirrorService) {

  $scope.formValues = {
    Name: '',
    Labels: [],
    AccessControlData: new AccessControlFormData()
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
    // The codemirror editor does not work with ng-model so we need to retrieve
    // the value directly from the editor.
    var configData = $scope.editor.getValue();
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

  function initView() {
    $document.ready(function() {
      var webEditorElement = $document[0].getElementById('config-editor', false);
      if (webEditorElement) {
        $scope.editor = CodeMirrorService.applyCodeMirrorOnElement(webEditorElement, false, false);
      }
    });
  }

  initView();
}]);
