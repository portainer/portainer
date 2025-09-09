import angular from 'angular';

import { gitForm } from './git-form';
import { gitFormAuthFieldset } from './git-form-auth-fieldset';
import { gitFormAutoUpdate } from './git-form-auto-update-fieldset';
import { gitFormRefField } from './git-form-ref-field';
import { gitFormUrlField } from './git-form-url-field';

export const gitFormModule = angular
  .module('portainer.app.components.git-form', [])
  .component('gitForm', gitForm) // kube deploy + docker stack create
  .component('gitFormUrlField', gitFormUrlField)
  .component('gitFormAuthFieldset', gitFormAuthFieldset)
  .component('gitFormAutoUpdateFieldset', gitFormAutoUpdate)
  .component('gitFormRefField', gitFormRefField).name;
