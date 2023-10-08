import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { CustomTemplatesVariablesDefinitionField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { CustomTemplatesVariablesField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { withControlledInput } from '@/react-tools/withControlledInput';
import { CustomTemplatesListItem } from '@/react/portainer/custom-templates/ListView/CustomTemplatesListItem';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';

import { VariablesFieldAngular } from './variables-field';

export const customTemplatesModule = angular
  .module('portainer.app.react.components.custom-templates', [])
  .component(
    'customTemplatesVariablesFieldReact',
    r2a(withControlledInput(CustomTemplatesVariablesField), [
      'value',
      'onChange',
      'definitions',
    ])
  )
  .component('customTemplatesVariablesField', VariablesFieldAngular)
  .component(
    'customTemplatesVariablesDefinitionField',
    r2a(withControlledInput(CustomTemplatesVariablesDefinitionField), [
      'onChange',
      'value',
      'errors',
      'isVariablesNamesFromParent',
    ])
  )
  .component(
    'customTemplatesListItem',
    r2a(withUIRouter(withCurrentUser(CustomTemplatesListItem)), [
      'onDelete',
      'onSelect',
      'template',
      'isSelected',
    ])
  ).name;
