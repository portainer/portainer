import _ from 'lodash';
import Mustache from 'mustache';

import { VariableDefinition } from './CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';

export function getTemplateVariables(templateStr: string) {
  const template = validateAndParse(templateStr);

  if (!template) {
    return null;
  }

  return template
    .filter(([type, value]) => type === 'name' && value)
    .map(([, value]) => ({
      name: value,
      label: '',
      defaultValue: '',
      description: '',
    }));
}

function validateAndParse(templateStr: string) {
  if (!templateStr) {
    return [];
  }

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
  const oldVariablesWithLabel = oldVariables.filter((v) => !!v.label);

  return [
    ...oldVariablesWithLabel,
    ...newVariables.filter(
      (v) => !oldVariablesWithLabel.find(({ name }) => name === v.name)
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
