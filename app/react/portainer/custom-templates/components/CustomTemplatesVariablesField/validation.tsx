import { array, object, string } from 'yup';

import { VariableDefinition } from '../CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';

export function validation(definitions: VariableDefinition[]) {
  return array(
    object({
      key: string().default(''),
      value: string().default(''),
    }).test('required-if-no-default-value', 'This field is required', (obj) => {
      const definition = definitions.find((d) => d.name === obj.key);
      if (!definition) {
        return true;
      }

      if (!definition.defaultValue && !obj.value) {
        return false;
      }

      return true;
    })
  );
}
