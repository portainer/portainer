import {
  GroupBase,
  OptionsOrGroups,
  SelectComponentsConfig,
} from 'react-select';
import _ from 'lodash';
import { AriaAttributes } from 'react';

import { AutomationTestingProps } from '@/types';

import { Select as ReactSelect } from '@@/form-components/ReactSelect';

export interface Option<TValue> {
  value: TValue;
  label: string;
  disabled?: boolean;
}

type Options<TValue> = OptionsOrGroups<
  Option<TValue>,
  GroupBase<Option<TValue>>
>;

interface SharedProps
  extends AutomationTestingProps,
    Pick<AriaAttributes, 'aria-label'> {
  name?: string;
  inputId?: string;
  placeholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  bindToBody?: boolean;
  isLoading?: boolean;
  noOptionsMessage?: () => string;
}

interface MultiProps<TValue> extends SharedProps {
  value: readonly TValue[];
  onChange(value: TValue[]): void;
  options: Options<TValue>;
  isMulti: true;
  components?: SelectComponentsConfig<
    Option<TValue>,
    true,
    GroupBase<Option<TValue>>
  >;
}

interface SingleProps<TValue> extends SharedProps {
  value: TValue;
  onChange(value: TValue | null): void;
  options: Options<TValue>;
  isMulti?: never;
  components?: SelectComponentsConfig<
    Option<TValue>,
    false,
    GroupBase<Option<TValue>>
  >;
}

type Props<TValue> = MultiProps<TValue> | SingleProps<TValue>;

export function PortainerSelect<TValue = string>(props: Props<TValue>) {
  return isMultiProps(props) ? (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <MultiSelect {...props} />
  ) : (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SingleSelect {...props} />
  );
}

function isMultiProps<TValue>(
  props: Props<TValue>
): props is MultiProps<TValue> {
  return 'isMulti' in props && !!props.isMulti;
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
  isClearable,
  bindToBody,
  components,
  isLoading,
  noOptionsMessage,
  isMulti,
  ...aria
}: SingleProps<TValue>) {
  const selectedValue =
    value ||
    (typeof value === 'number' && value === 0) ||
    (typeof value === 'string' && value === '')
      ? _.first(findSelectedOptions<TValue>(options, value))
      : null;

  return (
    <ReactSelect<Option<TValue>>
      name={name}
      isClearable={isClearable}
      getOptionLabel={(option) => option.label}
      getOptionValue={(option) => String(option.value)}
      options={options}
      value={selectedValue}
      onChange={(option) => onChange(option ? option.value : null)}
      isOptionDisabled={(option) => !!option.disabled}
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
      isDisabled={disabled}
      menuPortalTarget={bindToBody ? document.body : undefined}
      components={components}
      isLoading={isLoading}
      noOptionsMessage={noOptionsMessage}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...aria}
    />
  );
}

function findSelectedOptions<TValue>(
  options: Options<TValue>,
  value: TValue | readonly TValue[]
) {
  const valueArr = Array.isArray(value) ? value : [value];

  const values = _.compact(
    options.flatMap((option) => {
      if (isGroup(option)) {
        return option.options.find((option) => valueArr.includes(option.value));
      }

      if (valueArr.includes(option.value)) {
        return option;
      }

      return null;
    })
  );

  return values;
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
  isClearable,
  bindToBody,
  components,
  isLoading,
  noOptionsMessage,
  ...aria
}: Omit<MultiProps<TValue>, 'isMulti'>) {
  const selectedOptions = findSelectedOptions(options, value);
  return (
    <ReactSelect
      name={name}
      isMulti
      isClearable={isClearable}
      getOptionLabel={(option) => option.label}
      getOptionValue={(option) => String(option.value)}
      isOptionDisabled={(option) => !!option.disabled}
      options={options}
      value={selectedOptions}
      closeMenuOnSelect={false}
      onChange={(newValue) => onChange(newValue.map((option) => option.value))}
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
      isDisabled={disabled}
      menuPortalTarget={bindToBody ? document.body : undefined}
      components={components}
      isLoading={isLoading}
      noOptionsMessage={noOptionsMessage}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...aria}
    />
  );
}

function isGroup<TValue>(
  option: Option<TValue> | GroupBase<Option<TValue>>
): option is GroupBase<Option<TValue>> {
  return 'options' in option;
}
