import { array, object, string } from 'yup';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection/FormSection';
import { Input } from '@@/form-components/Input';
import { ArrayError } from '@@/form-components/InputList/InputList';
import { FormError } from '@@/form-components/FormError';

import { VariableDefinition } from '../CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';

export type Values = Array<{ key: string; value?: string }>;

interface Props {
  errors?: ArrayError<Values>;
  value: Values;
  definitions: VariableDefinition[] | undefined;
  onChange: (value: Values) => void;
}

export function CustomTemplatesVariablesField({
  errors,
  value,
  definitions,
  onChange,
}: Props) {
  if (!definitions || !definitions.length) {
    return null;
  }

  return (
    <FormSection title="Template Variables">
      {definitions.map((definition, index) => (
        <VariableFieldItem
          key={definition.name}
          definition={definition}
          value={value.find((v) => v.key === definition.name)?.value || ''}
          error={getError(errors, index)}
          onChange={(fieldValue) => {
            onChange(
              value.map((v) =>
                v.key === definition.name ? { ...v, value: fieldValue } : v
              )
            );
          }}
        />
      ))}

      {typeof errors === 'string' && <FormError>{errors}</FormError>}
    </FormSection>
  );
}

function VariableFieldItem({
  definition,
  value,
  error,
  onChange,
}: {
  definition: VariableDefinition;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const inputId = `${definition.name}-input`;

  return (
    <FormControl
      required={!definition.defaultValue}
      label={definition.label}
      key={definition.name}
      inputId={inputId}
      tooltip={definition.description}
      size="small"
      errors={error}
    >
      <Input
        name={`variables.${definition.name}`}
        value={value}
        id={inputId}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormControl>
  );
}

function getError(errors: ArrayError<Values> | undefined, index: number) {
  if (!errors || typeof errors !== 'object') {
    return undefined;
  }

  const error = errors[index];
  if (!error) {
    return undefined;
  }

  return typeof error === 'object' ? error.value : error;
}
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
