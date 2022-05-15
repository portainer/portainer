import { FormControl } from '@/portainer/components/form-components/FormControl';
import { FormSection } from '@/portainer/components/form-components/FormSection/FormSection';
import { Input } from '@/portainer/components/form-components/Input';
import { r2a } from '@/react-tools/react2angular';

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

export const CustomTemplatesVariablesFieldAngular = r2a(
  CustomTemplatesVariablesField,
  ['value', 'onChange', 'definitions']
);
