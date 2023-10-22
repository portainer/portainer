import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { CustomTemplatesVariablesDefinitionField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { CustomTemplatesVariablesField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { withControlledInput } from '@/react-tools/withControlledInput';
import { CustomTemplatesListItem } from '@/react/portainer/templates/custom-templates/ListView/CustomTemplatesListItem';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { AppTemplatesListItem } from '@/react/portainer/templates/app-templates/AppTemplatesListItem';
import {
  CommonFields,
  validation as commonFieldsValidation,
} from '@/react/portainer/custom-templates/components/CommonFields';
import { PlatformField } from '@/react/portainer/custom-templates/components/PlatformSelector';
import { TemplateTypeSelector } from '@/react/portainer/custom-templates/components/TemplateTypeSelector';
import { withFormValidation } from '@/react-tools/withFormValidation';

import { VariablesFieldAngular } from './variables-field';

export const ngModule = angular
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
  )
  .component(
    'appTemplatesListItem',
    r2a(withUIRouter(withCurrentUser(AppTemplatesListItem)), [
      'onSelect',
      'template',
      'isSelected',
      'onDuplicate',
    ])
  )
  .component(
    'customTemplatesPlatformSelector',
    r2a(PlatformField, ['onChange', 'value'])
  )
  .component(
    'customTemplatesTypeSelector',
    r2a(TemplateTypeSelector, ['onChange', 'value'])
  );

withFormValidation(
  ngModule,
  withControlledInput(CommonFields, { values: 'onChange' }),
  'customTemplatesCommonFields',
  [],
  commonFieldsValidation
);

export const customTemplatesModule = ngModule.name;
