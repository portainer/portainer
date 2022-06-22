import { FormError } from '@@/form-components/FormError';
import { Input } from '@@/form-components/Input';
import { InputList } from '@@/form-components/InputList';
import {
  InputListError,
  ItemProps,
} from '@@/form-components/InputList/InputList';

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
  isVariablesNamesFromParent?: boolean;
}

export function CustomTemplatesVariablesDefinitionField({
  onChange,
  value,
  errors,
  isVariablesNamesFromParent,
}: Props) {
  return (
    <InputList
      label="Variables Definition"
      onChange={onChange}
      value={value}
      renderItem={(item, onChange, error) => (
        <Item
          item={item}
          onChange={onChange}
          error={error}
          isNameReadonly={isVariablesNamesFromParent}
        />
      )}
      itemBuilder={() => ({
        label: '',
        name: '',
        defaultValue: '',
        description: '',
      })}
      errors={errors}
      textTip="List should map the mustache variables in the template file, if default value is empty, the variable will be required."
      isAddButtonHidden={isVariablesNamesFromParent}
    />
  );
}

interface DefinitionItemProps extends ItemProps<VariableDefinition> {
  isNameReadonly?: boolean;
}

function Item({ item, onChange, error, isNameReadonly }: DefinitionItemProps) {
  return (
    <div className="flex gap-2">
      <div>
        <Input
          value={item.name}
          name="name"
          onChange={handleChange}
          placeholder="Name (e.g var_name)"
          readOnly={isNameReadonly}
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
