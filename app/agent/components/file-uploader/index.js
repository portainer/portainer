import angular from 'angular';
import { FileUploaderController } from './fileUploaderController';

angular.module('portainer.agent').component('fileUploader', {
  templateUrl: './fileUploader.html',
  controller: FileUploaderController,
  bindings: {
    uploadFile: '<onFileSelected',
  },
});
