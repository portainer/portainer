import angular from 'angular';

import { CustomTemplatesVariablesDefinitionFieldAngular } from './CustomTemplatesVariablesDefinitionField';
import { variablesFieldModule } from './CustomTemplatesVariablesField';

export const customTemplatesModule = angular
  .module('portainer.custom-templates', [variablesFieldModule])

  .component(
    'customTemplatesVariablesDefinitionField',
    CustomTemplatesVariablesDefinitionFieldAngular
  ).name;
