import angular from 'angular';

import { TLSFieldset } from '@/react/portainer/environments/wizard';
import { withFormValidation } from '@/react-tools/withFormValidation';
import { tlsConfigValidation } from '@/react/portainer/environments/wizard/EnvironmentsCreationView/WizardDocker/APITab';

import { tlsFieldsetAngular } from './tlsFieldsetAngular';

export const ngModule = angular
  .module('portainer.app.components.tls-fieldset', [])
  .component('tlsFieldset', tlsFieldsetAngular);

export const tlsFieldsetModule = ngModule.name;

withFormValidation(
  ngModule,
  TLSFieldset,
  'tlsFieldsetReact',
  ['values', 'onChange', 'errors'],
  tlsConfigValidation
);
