import angular from 'angular';

import { gitForm } from './git-form';

export const gitFormModule = angular
  .module('portainer.app.components.git-form', [])
  .component('gitForm', gitForm).name;
