import { OptionsOrGroups } from 'react-select';
import _ from 'lodash';

import { AutomationTestingProps } from '@/types';

import { Select as ReactSelect } from '@@/form-components/ReactSelect';

interface Option<TValue> {
  value: TValue;
  label: string;
}

type Group<TValue> = { label: string; options: Option<TValue>[] };

type Options<TValue> = OptionsOrGroups<Option<TValue>, Group<TValue>>;

interface SharedProps {
  name?: string;
  inputId?: string;
  placeholder?: string;
  disabled?: boolean;
}

interface MultiProps<TValue> extends AutomationTestingProps {
  value: Option<TValue>[];
  onChange(value: readonly Option<TValue>[]): void;
  options: Options<TValue>;
}

interface SingleProps<TValue> extends AutomationTestingProps {
  value: TValue;
  onChange(value: TValue | null): void;
  options: Options<TValue>;
}

type Props<TValue> = SharedProps &
  (SingleProps<TValue> | (MultiProps<TValue> & { isMulti: true }));

export function Select<TValue>(props: Props<TValue>) {
  return 'isMulti' in props ? (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <MultiSelect {...props} />
  ) : (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SingleSelect {...props} />
  );
}

export function SingleSelect<TValue = string>({
  name,
  options,
  onChange,
  value,
  'data-cy': dataCy,
  disabled,
  inputId,
  placeholder,
}: SharedProps & SingleProps<TValue>) {
  const selectedValue = findOption<TValue>(options, value);

  return (
    <ReactSelect<Option<TValue>>
      name={name}
      getOptionLabel={(option) => option.label}
      getOptionValue={(option) => String(option.value)}
      options={options}
      value={selectedValue}
      onChange={(option) => onChange(option ? option.value : null)}
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
      isDisabled={disabled}
    />
  );
}

function findOption<TValue>(options: Options<TValue>, value: TValue) {
  return _.first(
    _.compact(
      options.flatMap((option) => {
        if (isGroup(option)) {
          return option.options.find((option) => option.value === value);
        }

        if (option.value === value) {
          return option;
        }

        return null;
      })
    )
  );
}

export function MultiSelect<TValue = string>({
  name,
  value,
  onChange,
  options,
  'data-cy': dataCy,
  inputId,
  placeholder,
  disabled,
}: SharedProps & MultiProps<TValue>) {
  return (
    <ReactSelect
      name={name}
      isMulti
      getOptionLabel={(option) => option.label}
      getOptionValue={(option) => String(option.value)}
      options={options}
      value={value}
      closeMenuOnSelect={false}
      onChange={onChange}
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
      isDisabled={disabled}
    />
  );
}

function isGroup<TValue>(
  option: Option<TValue> | Group<TValue>
): option is Group<TValue> {
  return 'options' in option;
}
