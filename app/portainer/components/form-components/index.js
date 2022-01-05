import angular from 'angular';

import { webEditorForm } from './web-editor-form';
import { fileUploadForm } from './file-upload-form';

import { SwitchFieldAngular } from './SwitchField';

import { FileUploadFieldAngular } from './FileUpload';

export default angular
  .module('portainer.app.components.form', [])
  .component('webEditorForm', webEditorForm)
  .component('fileUploadForm', fileUploadForm)
  .component('fileUploadField', FileUploadFieldAngular)
  .component('porSwitchField', SwitchFieldAngular).name;
