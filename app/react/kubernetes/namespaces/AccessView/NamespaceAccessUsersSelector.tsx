import { User as UserIcon, Users as TeamIcon } from 'lucide-react';
import { OptionProps, components, MultiValueGenericProps } from 'react-select';

import { Select } from '@@/form-components/ReactSelect';

import { EnvironmentAccess } from './types';

interface Props {
  name?: string;
  value: EnvironmentAccess[];
  onChange(value: readonly EnvironmentAccess[]): void;
  options: EnvironmentAccess[];
  dataCy: string;
  inputId?: string;
  placeholder?: string;
}

export function NamespaceAccessUsersSelector({
  onChange,
  options,
  value,
  dataCy,
  inputId,
  name,
  placeholder,
}: Props) {
  return (
    <Select
      isMulti
      name={name}
      getOptionLabel={(option) => option.name}
      getOptionValue={(option) => `${option.id}-${option.type}`}
      options={options}
      value={value}
      closeMenuOnSelect={false}
      onChange={onChange}
      data-cy={dataCy}
      id={dataCy}
      inputId={inputId}
      placeholder={placeholder}
      components={{ MultiValueLabel, Option: OptionComponent }}
    />
  );
}

function isOption(option: unknown): option is EnvironmentAccess {
  return !!option && typeof option === 'object' && 'type' in option;
}

function OptionComponent({
  data,
  ...props
}: OptionProps<EnvironmentAccess, true>) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <components.Option data={data} {...props}>
      {isOption(data) && <Label option={data} />}
    </components.Option>
  );
}

function MultiValueLabel({
  data,
  ...props
}: MultiValueGenericProps<EnvironmentAccess, true>) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <components.MultiValueLabel data={data} {...props}>
      {isOption(data) && <Label option={data} />}
    </components.MultiValueLabel>
  );
}

function Label({ option }: { option: EnvironmentAccess }) {
  const Icon = option.type === 'user' ? UserIcon : TeamIcon;

  return (
    <div className="flex items-center gap-1">
      <Icon />
      <span>{option.name}</span>
      <span>|</span>
      <span>{option.role.name}</span>
    </div>
  );
}
