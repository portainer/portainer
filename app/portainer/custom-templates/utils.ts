import _ from 'lodash';
import Mustache from 'mustache';

import { VariableDefinition } from './CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';

export function getTemplateVariables(templateStr: string) {
  const template = validateAndParse(templateStr);

  if (!template) {
    return null;
  }

  return template
    .filter(([type]) => type === 'name')
    .map(([, value]) => ({
      name: value,
      label: '',
      defaultValue: '',
      description: '',
    }));
}

function validateAndParse(templateStr: string) {
  try {
    return Mustache.parse(templateStr);
  } catch (e) {
    return null;
  }
}

export function intersectVariables(
  oldVariables: VariableDefinition[] = [],
  newVariables: VariableDefinition[] = []
) {
  return [
    ...oldVariables.filter((v) => !!v.label),
    ...newVariables.filter(
      (v) => !oldVariables.find(({ name }) => name === v.name)
    ),
  ];
}

export function renderTemplate(
  template: string,
  variables: Record<string, string>,
  definitions: VariableDefinition[]
) {
  const state = Object.fromEntries(
    _.compact(
      Object.entries(variables).map(([name, value]) => {
        if (value) {
          return [name, value];
        }

        const definition = definitions.find((def) => def.name === name);
        if (!definition) {
          return null;
        }

        return [name, definition.defaultValue || `{{ ${definition.name} }}`];
      })
    )
  );

  return Mustache.render(template, state);
}
