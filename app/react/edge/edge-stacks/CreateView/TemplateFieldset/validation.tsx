import { mixed, object, SchemaOf, string } from 'yup';

import { variablesFieldValidation } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { VariableDefinition } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';

import { envVarsFieldsetValidation } from './EnvVarsFieldset';

export function validation({
  definitions,
}: {
  definitions: VariableDefinition[];
}) {
  return object({
    type: string().oneOf(['custom', 'app']).required(),
    envVars: envVarsFieldsetValidation()
      .optional()
      .when('type', {
        is: 'app',
        then: (schema: SchemaOf<unknown, never>) => schema.required(),
      }),
    file: mixed().optional(),
    template: object().optional().default(null),
    variables: variablesFieldValidation(definitions)
      .optional()
      .when('type', {
        is: 'custom',
        then: (schema) => schema.required(),
      }),
  });
}

export { validation as templateFieldsetValidation };
