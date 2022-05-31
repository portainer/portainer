import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { CustomTemplatesVariablesDefinitionField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { CustomTemplatesVariablesField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';

import { VariablesFieldAngular } from './variables-field';

export const customTemplatesModule = angular
  .module('portainer.app.react.components.custom-templates', [])
  .component(
    'customTemplatesVariablesFieldReact',
    r2a(CustomTemplatesVariablesField, ['value', 'onChange', 'definitions'])
  )
  .component('customTemplatesVariablesField', VariablesFieldAngular)
  .component(
    'customTemplatesVariablesDefinitionField',
    r2a(CustomTemplatesVariablesDefinitionField, [
      'onChange',
      'value',
      'errors',
      'isVariablesNamesFromParent',
    ])
  ).name;
