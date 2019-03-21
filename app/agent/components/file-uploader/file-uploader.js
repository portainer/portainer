angular.module('portainer.agent').component('fileUploader', {
  templateUrl: './file-uploader.html',
  controller: 'FileUploaderController',
  bindings: {
    uploadFile: '<onFileSelected'
  }
});
