angular.module('portainer.agent').controller('FileUploaderController', [
  'HostBrowserService', 'Notifications',
  function FileUploaderController(HostBrowserService, Notifications) {
    var ctrl = this;

    ctrl.state = {
      uploadInProgress: false
    };

    ctrl.uploadFile = uploadFile;

    function uploadFile() {
      ctrl.state.uploadInProgress = true;
      HostBrowserService.upload('/', ctrl.file)
        .then(function onFileUpload() {
          ctrl.onFileUploaded();
        })
        .catch(function onFileUpload(err) {
          Notifications.error('Failure', err, 'Unable to upload file');
        })
        .finally(function toggleUploadProgress() {
          ctrl.state.uploadInProgress = false;
        });
    }
  }
]);
