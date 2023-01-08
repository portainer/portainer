import angular from 'angular';

import { gitForm } from './git-form';
import { gitFormAuthFieldset } from './git-form-auth-fieldset';
import { gitFormAutoUpdate } from './git-form-auto-update-fieldset';
import { gitFormRefField } from './git-form-ref-field';

export const gitFormModule = angular
  .module('portainer.app.components.git-form', [])
  .component('gitForm', gitForm)
  .component('gitFormAuthFieldset', gitFormAuthFieldset)
  .component('gitFormAutoUpdateFieldset', gitFormAutoUpdate)
  .component('gitFormRefField', gitFormRefField).name;
