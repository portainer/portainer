import { mixed, number, object, SchemaOf } from 'yup';

import { variablesFieldValidation } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { VariableDefinition } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { envVarsFieldsetValidation } from '@/react/portainer/templates/app-templates/DeployFormWidget/EnvVarsFieldset';
import { TemplateEnv } from '@/react/portainer/templates/app-templates/types';

import { Values } from './types';

export function templateFieldsetValidation({
  customVariablesDefinitions,
  appTemplateVariablesDefinitions,
}: {
  customVariablesDefinitions: Array<VariableDefinition>;
  appTemplateVariablesDefinitions: Array<TemplateEnv>;
}): SchemaOf<Values> {
  return object({
    type: mixed<'app' | 'custom'>().oneOf(['custom', 'app']).optional(),
    envVars: envVarsFieldsetValidation(appTemplateVariablesDefinitions)
      .optional()
      .when('type', {
        is: 'app',
        then: (schema: SchemaOf<unknown, never>) => schema.required(),
      }),
    templateId: mixed()
      .optional()
      .when('type', {
        is: true,
        then: () => number().required(),
      }),
    variables: variablesFieldValidation(customVariablesDefinitions)
      .optional()
      .when('type', {
        is: 'custom',
        then: (schema) => schema.required(),
      }),
  });
}
