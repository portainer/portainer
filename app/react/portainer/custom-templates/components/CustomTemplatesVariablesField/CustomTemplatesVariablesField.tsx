import { FormSection } from '@@/form-components/FormSection/FormSection';
import { ArrayError } from '@@/form-components/InputList/InputList';
import { FormError } from '@@/form-components/FormError';

import { VariableDefinition } from '../CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';

import { VariableFieldItem } from './VariableFieldItem';

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
          error={getError(errors, index)}
          value={value.find((v) => v.key === definition.name)?.value}
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
