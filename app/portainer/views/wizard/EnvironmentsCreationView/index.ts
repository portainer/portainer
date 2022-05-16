import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';

import { WizardDocker } from './WizardDocker';
import { WizardKubernetes } from './WizardKubernetes';
import { WizardAzure } from './WizardAzure';

export const environmentCreationViewModule = angular
  .module('portainer.wizard.environmentCreation', [])
  .component('wizardDocker', r2a(WizardDocker, ['onCreate']))
  .component('wizardKubernetes', r2a(WizardKubernetes, ['onCreate']))
  .component('wizardAzure', r2a(WizardAzure, ['onCreate'])).name;
