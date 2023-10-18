import _ from 'lodash';
import Mustache from 'mustache';

import { VariableDefinition } from './CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';

export function getTemplateVariables(templateStr: string) {
  const [template, error] = validateAndParse(templateStr);

  if (!template) {
    return [null, error] as const;
  }

  return [
    template
      .filter(([type, value]) => type === 'name' && value)
      .map(([, value]) => ({
        name: value,
        label: '',
        defaultValue: '',
        description: '',
      })),
    null,
  ] as const;
}
type TemplateSpans = ReturnType<typeof Mustache.parse>;
function validateAndParse(
  templateStr: string
): readonly [TemplateSpans, null] | readonly [null, string] {
  if (!templateStr) {
    return [[] as TemplateSpans, null] as const;
  }

  try {
    return [Mustache.parse(templateStr), null] as const;
  } catch (e) {
    if (!(e instanceof Error)) {
      return [null, 'Parse error'] as const;
    }

    return [null, e.message] as const;
  }
}

export function intersectVariables(
  oldVariables: VariableDefinition[] = [],
  newVariables: VariableDefinition[] = []
) {
  const oldVariablesWithLabel = oldVariables.filter((v) => !!v.label);

  return _.uniqBy(
    [
      ...oldVariablesWithLabel,
      ...newVariables.filter(
        (v) => !oldVariablesWithLabel.find(({ name }) => name === v.name)
      ),
    ],
    'name'
  );
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

  return Mustache.render(template, state, undefined, { escape: (t) => t });
}
