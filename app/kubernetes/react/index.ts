import angular from 'angular';

import { componentsModule } from './components';
import { viewsModule } from './views';

export const reactModule = angular.module('portainer.kubernetes.react', [
  viewsModule,
  componentsModule,
]).name;
