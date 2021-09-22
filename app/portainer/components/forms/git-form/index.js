import angular from 'angular';

import { gitForm } from './git-form';
import { gitFormAuthFieldset } from './git-form-auth-fieldset';
import { gitFormAdditionalFilesPanel } from './git-form-additional-files-panel';
import { gitFormAdditionalFileItem } from './/git-form-additional-files-panel/git-form-additional-file-item';
import { gitFormAutoUpdateFieldset } from './git-form-auto-update-fieldset';
import { gitFormComposePathField } from './git-form-compose-path-field';
import { gitFormRefField } from './git-form-ref-field';
import { gitFormUrlField } from './git-form-url-field';
import { gitFormInfoPanel } from './git-form-info-panel';

export default angular
  .module('portainer.app.components.forms.git', [])
  .component('gitFormComposePathField', gitFormComposePathField)
  .component('gitFormRefField', gitFormRefField)
  .component('gitForm', gitForm)
  .component('gitFormUrlField', gitFormUrlField)
  .component('gitFormInfoPanel', gitFormInfoPanel)
  .component('gitFormAdditionalFilesPanel', gitFormAdditionalFilesPanel)
  .component('gitFormAdditionalFileItem', gitFormAdditionalFileItem)
  .component('gitFormAutoUpdateFieldset', gitFormAutoUpdateFieldset)
  .component('gitFormAuthFieldset', gitFormAuthFieldset).name;
