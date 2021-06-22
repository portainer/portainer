import angular from 'angular';

import { gitForm } from './git-form';
import { gitFormAuthFieldset } from './git-form-auth-fieldset';
import { gitFormComposePathField } from './git-form-compose-path-field';
import { gitFormRefField } from './git-form-ref-field';
import { gitFormUrlField } from './git-form-url-field';

export default angular
  .module('portainer.app.components.forms.git', [])
  .component('gitFormComposePathField', gitFormComposePathField)
  .component('gitFormRefField', gitFormRefField)
  .component('gitForm', gitForm)
  .component('gitFormUrlField', gitFormUrlField)
  .component('gitFormAuthFieldset', gitFormAuthFieldset).name;
