import angular from 'angular';

import { webEditorForm } from './web-editor-form';
import { fileUploadForm } from './file-upload-form';

import { SwitchFieldAngular } from './SwitchField';

import { FileUploadFieldAngular, FileUploadFormAngular } from './FileUpload';

export default angular
  .module('portainer.app.components.form', [])
  .component('webEditorForm', webEditorForm)
  .component('fileUploadForm', fileUploadForm)
  .component('fileUploadFormAngular', FileUploadFormAngular) // TODO mrydel: rename to fileUploadForm and remove angular
  .component('fileUploadField', FileUploadFieldAngular)
  .component('porSwitchField', SwitchFieldAngular).name;
