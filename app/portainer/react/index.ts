import angular from 'angular';

import { componentsModule } from './components';
import { viewsModule } from './views';

export const reactModule = angular.module('portainer.app.react', [
  viewsModule,
  componentsModule,
]).name;
