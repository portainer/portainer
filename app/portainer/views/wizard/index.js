import angular from 'angular';
import { environmentCreationViewModule } from './EnvironmentsCreationView';
import controller from './wizard-view.controller.js';

export const wizardModule = angular.module('portainer.app.wizard', [environmentCreationViewModule]).component('wizardView', {
  templateUrl: './wizard-view.html',
  controller,
}).name;
