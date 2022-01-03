import angular from 'angular';

import { webEditorForm } from './web-editor-form';
import { fileUploadForm } from './file-upload-form';

import { SwitchFieldAngular } from './SwitchField';

import { FileUploadAngular } from './FileUpload';

export default angular
  .module('portainer.app.components.form', [])
  .component('webEditorForm', webEditorForm)
  .component('fileUploadForm', fileUploadForm)
  .component('fileUploadAngular', FileUploadAngular)
  .component('porSwitchField', SwitchFieldAngular).name;
