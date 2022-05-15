import angular from 'angular';

import { CustomTemplatesVariablesFieldAngular } from './CustomTemplatesVariablesField';
import { VariablesFieldAngular } from './VariablesFieldAngular';

export {
  CustomTemplatesVariablesField,
  CustomTemplatesVariablesFieldAngular,
} from './CustomTemplatesVariablesField';

export const variablesFieldModule = angular
  .module('portainer.kubernetes.custom-templates.variables-field', [])
  .component(
    'customTemplatesVariablesFieldReact',
    CustomTemplatesVariablesFieldAngular
  )
  .component('customTemplatesVariablesField', VariablesFieldAngular).name;
