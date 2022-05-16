import angular from 'angular';

import { reactModule } from './react';

export const nomadModule = angular.module('portainer.nomad', [
  'portainer.app',
  reactModule,
]).name;
