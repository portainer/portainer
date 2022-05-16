import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';

import { WizardDocker } from './WizardDocker';

export const environmentCreationViewModule = angular
  .module('portainer.wizard.environmentCreation', [])
  .component('wizardDocker', r2a(WizardDocker, ['onCreate'])).name;
