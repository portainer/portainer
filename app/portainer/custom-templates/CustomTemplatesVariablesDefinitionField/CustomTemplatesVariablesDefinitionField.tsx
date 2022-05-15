import { FormError } from '@/portainer/components/form-components/FormError';
import { Input } from '@/portainer/components/form-components/Input';
import { InputList } from '@/portainer/components/form-components/InputList';
import {
  InputListError,
  ItemProps,
} from '@/portainer/components/form-components/InputList/InputList';
import { r2a } from '@/react-tools/react2angular';

export interface VariableDefinition {
  name: string;
  label: string;
  defaultValue: string;
  description: string;
}

interface Props {
  value: VariableDefinition[];
  onChange: (value: VariableDefinition[]) => void;
  errors?: InputListError<VariableDefinition>[] | string;
}

export function CustomTemplatesVariablesDefinitionField({
  onChange,
  value,
  errors,
}: Props) {
  return (
    <InputList
      label="Variables Definition"
      onChange={onChange}
      value={value}
      item={Item}
      itemBuilder={() => ({
        label: '',
        name: '',
        defaultValue: '',
        description: '',
      })}
      errors={errors}
      textTip="List should map the mustache variables in the template file, if default value is empty, the variable will be required."
    />
  );
}

function Item({ item, onChange, error }: ItemProps<VariableDefinition>) {
  return (
    <div className="flex gap-2">
      <div>
        <Input
          value={item.name}
          name="name"
          onChange={handleChange}
          placeholder="Name (e.g ENV_VAR)"
        />
        {error?.name && <FormError>{error.name}</FormError>}
      </div>
      <div>
        <Input
          value={item.label}
          onChange={handleChange}
          placeholder="Label"
          name="label"
        />
        {error?.label && <FormError>{error.label}</FormError>}
      </div>
      <div>
        <Input
          name="description"
          value={item.description}
          onChange={handleChange}
          placeholder="Description"
        />
        {error?.description && <FormError>{error.description}</FormError>}
      </div>
      <div>
        <Input
          value={item.defaultValue}
          onChange={handleChange}
          placeholder="Default Value"
          name="defaultValue"
        />
        {error?.defaultValue && <FormError>{error.defaultValue}</FormError>}
      </div>
    </div>
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...item, [e.target.name]: e.target.value });
  }
}

export const CustomTemplatesVariablesDefinitionFieldAngular = r2a(
  CustomTemplatesVariablesDefinitionField,
  ['onChange', 'value', 'errors']
);
