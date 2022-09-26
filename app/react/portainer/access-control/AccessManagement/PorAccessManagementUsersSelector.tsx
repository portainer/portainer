import { User as UserIcon, Users as TeamIcon } from 'react-feather';
import { OptionProps, components, MultiValueGenericProps } from 'react-select';

import { Select } from '@@/form-components/ReactSelect';

type Option = { Type: 'user' | 'team'; Id: number; Name: string };

interface Props {
  value: Option[];
  onChange(value: readonly Option[]): void;
  options: Option[];
}

export function PorAccessManagementUsersSelector({
  options,
  value,
  onChange,
}: Props) {
  return (
    <div className="form-group">
      <label
        className="col-sm-3 col-lg-2 control-label text-left"
        htmlFor="users-selector"
      >
        Select user(s) and/or team(s)
      </label>
      <div className="col-sm-9 col-lg-4">
        {options.length === 0 ? (
          <span className="small text-muted">No users or teams available.</span>
        ) : (
          <Select
            isMulti
            getOptionLabel={(option) => option.Name}
            getOptionValue={(option) => `${option.Id}-${option.Type}`}
            options={options}
            value={value}
            closeMenuOnSelect={false}
            onChange={onChange}
            data-cy="component-selectUser"
            inputId="users-selector"
            placeholder="Select one or more users and/or teams"
            components={{ MultiValueLabel, Option: OptionComponent }}
          />
        )}
      </div>
    </div>
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
    </div>
  );
}
