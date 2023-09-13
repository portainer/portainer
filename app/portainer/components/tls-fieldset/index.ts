import angular from 'angular';

import {
  TLSFieldset,
  tlsConfigValidation,
} from '@/react/components/TLSFieldset';
import { withFormValidation } from '@/react-tools/withFormValidation';

export const ngModule = angular.module(
  'portainer.app.components.tls-fieldset',
  []
);

export const tlsFieldsetModule = ngModule.name;

withFormValidation(
  ngModule,
  TLSFieldset,
  'tlsFieldset',
  [],
  tlsConfigValidation
);
