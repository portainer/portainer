import angular from 'angular';

import { wizardModule } from './wizard';

export const viewsModule = angular.module('portainer.app.react.views', [
  wizardModule,
]).name;
