angular.module('portainer.app')
.controller('JobFormController', ['$state', 'LocalStorage', 'EndpointService', 'EndpointProvider', 'Notifications',
function ($state, LocalStorage, EndpointService, EndpointProvider, Notifications) {
  var ctrl = this;

  ctrl.$onInit = onInit;
  ctrl.editorUpdate = editorUpdate;
  ctrl.executeJob = executeJob;

  ctrl.state = {
    Method: 'editor',
    formValidationError: '',
    actionInProgress: false
  };

  ctrl.formValues = {
    Image: 'ubuntu:latest',
    JobFileContent: '',
    JobFile: null
  };

  function onInit() {
    var storedImage = LocalStorage.getJobImage();
    if (storedImage) {
      ctrl.formValues.Image = storedImage;
    }
  }

  function editorUpdate(cm) {
    ctrl.formValues.JobFileContent = cm.getValue();
  }

  function createJob(image, method) {
    var endpointId = EndpointProvider.endpointID();
    var nodeName = ctrl.nodeName;

    if (method === 'editor') {
      var jobFileContent = ctrl.formValues.JobFileContent;
      return EndpointService.executeJobFromFileContent(image, jobFileContent, endpointId, nodeName);
    }

    var jobFile = ctrl.formValues.JobFile;
    return EndpointService.executeJobFromFileUpload(image, jobFile, endpointId, nodeName);
  }

  function executeJob() {
    var method = ctrl.state.Method;
    if (method === 'editor' && ctrl.formValues.JobFileContent === '') {
      ctrl.state.formValidationError = 'Script file content must not be empty';
      return;
    }

    var image = ctrl.formValues.Image;
    LocalStorage.storeJobImage(image);

    ctrl.state.actionInProgress = true;
    createJob(image, method)
    .then(function success() {
      Notifications.success('Job successfully created');
      $state.go('^');
    })
    .catch(function error(err) {
      Notifications.error('Job execution failure', err);
    })
    .finally(function final() {
      ctrl.state.actionInProgress = false;
    });
  }
}]);
