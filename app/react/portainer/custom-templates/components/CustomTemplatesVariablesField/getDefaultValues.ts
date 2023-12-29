import { VariableDefinition } from '../CustomTemplatesVariablesDefinitionField';

import { Values } from './CustomTemplatesVariablesField';

export function getDefaultValues(definitions: VariableDefinition[]): Values {
  return definitions.map((v) => ({
    key: v.name,
    value: v.defaultValue,
  }));
}
