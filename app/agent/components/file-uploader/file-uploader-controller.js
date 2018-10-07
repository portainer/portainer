angular.module('portainer.agent').controller('FileUploaderController', [
  '$q',
  function FileUploaderController($q) {
    var ctrl = this;

    ctrl.state = {
      uploadInProgress: false
    };

    ctrl.onFileSelected = onFileSelected;

    function onFileSelected(file) {
      if (!file) {
        return;
      }

      ctrl.state.uploadInProgress = true;
      $q.when(ctrl.uploadFile(file)).finally(function toggleProgress() {
        ctrl.state.uploadInProgress = false;
      });
    }
  }
]);
