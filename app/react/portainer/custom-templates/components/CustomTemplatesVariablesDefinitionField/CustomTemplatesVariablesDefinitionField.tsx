import { SchemaOf, array, object, string } from 'yup';

import { FormError } from '@@/form-components/FormError';
import { Input } from '@@/form-components/Input';
import { InputList } from '@@/form-components/InputList';
import { ArrayError, ItemProps } from '@@/form-components/InputList/InputList';

export interface VariableDefinition {
  name: string;
  label: string;
  defaultValue: string;
  description: string;
}

export type Values = VariableDefinition[];

interface Props {
  value: Values;
  onChange: (value: Values) => void;
  errors?: ArrayError<Values>;
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
      label="Variables definition"
      onChange={onChange}
      value={value}
      renderItem={(item, onChange, index, error) => (
        <Item
          item={item}
          onChange={onChange}
          error={error}
          index={index}
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
      data-cy="custom-templates-variables-field"
    />
  );
}

interface DefinitionItemProps extends ItemProps<VariableDefinition> {
  isNameReadonly?: boolean;
}

function Item({
  item,
  onChange,
  error,
  isNameReadonly,
  index,
}: DefinitionItemProps) {
  const errorObj = typeof error === 'object' ? error : {};

  return (
    <div className="flex gap-2">
      <div>
        <Input
          value={item.name}
          name="name"
          onChange={handleChange}
          placeholder="Name (e.g var_name)"
          readOnly={isNameReadonly}
          data-cy={`custom-templates-item-name-field_${index}`}
        />
        {errorObj?.name && <FormError>{errorObj.name}</FormError>}
      </div>
      <div>
        <Input
          value={item.label}
          onChange={handleChange}
          placeholder="Label"
          name="label"
          data-cy={`custom-templates-item-label-field_${index}`}
        />
        {errorObj?.label && <FormError>{errorObj.label}</FormError>}
      </div>
      <div>
        <Input
          name="description"
          value={item.description}
          onChange={handleChange}
          placeholder="Description"
          data-cy={`custom-templates-item-description-field_${index}`}
        />
        {errorObj?.description && <FormError>{errorObj.description}</FormError>}
      </div>
      <div>
        <Input
          value={item.defaultValue}
          onChange={handleChange}
          placeholder="Default Value"
          name="defaultValue"
          data-cy={`custom-templates-item-default-value-field_${index}`}
        />
        {errorObj?.defaultValue && (
          <FormError>{errorObj.defaultValue}</FormError>
        )}
      </div>
    </div>
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...item, [e.target.name]: e.target.value });
  }
}

function itemValidation(): SchemaOf<VariableDefinition> {
  return object().shape({
    name: string().required('Name is required'),
    label: string().required('Label is required'),
    defaultValue: string().default(''),
    description: string().default(''),
  });
}

export function validation(): SchemaOf<Values> {
  return array().of(itemValidation());
}
