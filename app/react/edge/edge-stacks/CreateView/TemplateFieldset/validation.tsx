import { mixed, object, SchemaOf, string } from 'yup';

import { variablesFieldValidation } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { VariableDefinition } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { envVarsFieldsetValidation } from '@/react/portainer/templates/app-templates/DeployFormWidget/EnvVarsFieldset';
import { TemplateEnv } from '@/react/portainer/templates/app-templates/types';

function validation({
  customVariablesDefinitions,
  envVarDefinitions,
}: {
  customVariablesDefinitions: VariableDefinition[];
  envVarDefinitions: Array<TemplateEnv>;
}) {
  return object({
    type: string().oneOf(['custom', 'app']).required(),
    envVars: envVarsFieldsetValidation(envVarDefinitions)
      .optional()
      .when('type', {
        is: 'app',
        then: (schema: SchemaOf<unknown, never>) => schema.required(),
      }),
    file: mixed().optional(),
    template: object().optional().default(null),
    variables: variablesFieldValidation(customVariablesDefinitions)
      .optional()
      .when('type', {
        is: 'custom',
        then: (schema) => schema.required(),
      }),
  });
}

export { validation as templateFieldsetValidation };
