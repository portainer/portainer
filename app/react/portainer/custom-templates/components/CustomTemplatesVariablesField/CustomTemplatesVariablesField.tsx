import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection/FormSection';
import { Input } from '@@/form-components/Input';

import { VariableDefinition } from '../CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';

export type Variables = Record<string, string>;

interface Props {
  value: Variables;
  definitions?: VariableDefinition[];
  onChange: (value: Variables) => void;
}

export function CustomTemplatesVariablesField({
  value,
  definitions,
  onChange,
}: Props) {
  if (!definitions || !definitions.length) {
    return null;
  }

  return (
    <FormSection title="Template Variables">
      {definitions.map((def) => {
        const inputId = `${def.name}-input`;
        const variable = value[def.name] || '';
        return (
          <FormControl
            required={!def.defaultValue}
            label={def.label}
            key={def.name}
            inputId={inputId}
            tooltip={def.description}
            size="small"
          >
            <Input
              name={`variables.${def.name}`}
              value={variable}
              id={inputId}
              onChange={(e) =>
                onChange({
                  ...value,
                  [def.name]: e.target.value,
                })
              }
            />
          </FormControl>
        );
      })}
    </FormSection>
  );
}
