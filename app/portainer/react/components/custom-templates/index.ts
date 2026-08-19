import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { CustomTemplatesVariablesField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { withControlledInput } from '@/react-tools/withControlledInput';

import { VariablesFieldAngular } from './variables-field';

export const ngModule = angular
  .module('portainer.app.react.components.custom-templates', [])
  .component(
    'customTemplatesVariablesFieldReact',
    r2a(withControlledInput(CustomTemplatesVariablesField), [
      'value',
      'onChange',
      'definitions',
      'errors',
    ])
  )
  .component('customTemplatesVariablesField', VariablesFieldAngular);

export const customTemplatesModule = ngModule.name;
