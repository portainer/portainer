import { User as UserIcon, Users as TeamIcon } from 'react-feather';
import { OptionProps, components, MultiValueGenericProps } from 'react-select';

import { Select } from '@@/form-components/ReactSelect';

type Role = { Name: string };
type Option = { Type: 'user' | 'team'; Id: number; Name: string; Role: Role };

interface Props {
  name?: string;
  value: Option[];
  onChange(value: readonly Option[]): void;
  options: Option[];
  dataCy?: string;
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
      getOptionLabel={(option) => option.Name}
      getOptionValue={(option) => `${option.Id}-${option.Type}`}
      options={options}
      value={value}
      closeMenuOnSelect={false}
      onChange={onChange}
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
      components={{ MultiValueLabel, Option: OptionComponent }}
    />
  );
}

function isOption(option: unknown): option is Option {
  return !!option && typeof option === 'object' && 'Type' in option;
}

function OptionComponent({ data, ...props }: OptionProps<Option, true>) {
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
}: MultiValueGenericProps<Option, true>) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <components.MultiValueLabel data={data} {...props}>
      {isOption(data) && <Label option={data} />}
    </components.MultiValueLabel>
  );
}

function Label({ option }: { option: Option }) {
  const Icon = option.Type === 'user' ? UserIcon : TeamIcon;

  return (
    <div className="flex gap-1 items-center">
      <Icon />
      <span>{option.Name}</span>
      <span>|</span>
      <span>{option.Role.Name}</span>
    </div>
  );
}
