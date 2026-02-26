import { useState } from 'react';
import type { AriaAttributes } from 'react';
import {
  GroupBase,
  OptionsOrGroups,
  SelectComponentsConfig,
} from 'react-select';
import _ from 'lodash';
import { FilterOptionOption } from 'react-select/dist/declarations/src/filters';

import { AutomationTestingProps } from '@/types';

import {
  Creatable,
  Select as ReactSelect,
} from '@@/form-components/ReactSelect';

export interface Option<TValue> {
  value: TValue;
  label: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface GroupOption<TValue> {
  label: string;
  options: Option<TValue>[];
}

type Options<TValue> = OptionsOrGroups<
  Option<TValue>,
  GroupBase<Option<TValue>>
>;

interface SharedProps<TValue>
  extends AutomationTestingProps,
    Pick<AriaAttributes, 'aria-label'> {
  name?: string;
  inputId?: string;
  size?: 'sm' | 'md';
  placeholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  bindToBody?: boolean;
  isLoading?: boolean;
  noOptionsMessage?: () => string;
  loadingMessage?: () => string;
  filterOption?: (
    option: FilterOptionOption<Option<TValue>>,
    rawInput: string
  ) => boolean;
  getOptionValue?: (option: TValue) => string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

interface MultiProps<TValue> extends SharedProps<TValue> {
  value: readonly TValue[];
  onChange(value: TValue[]): void;
  options: Options<TValue>;
  isMulti: true;
  components?: SelectComponentsConfig<
    Option<TValue>,
    true,
    GroupBase<Option<TValue>>
  >;
  formatCreateLabel?: (input: string) => string;
  onCreateOption?: (input: string) => void;
  isCreatable?: boolean;
}

interface SingleProps<TValue> extends SharedProps<TValue> {
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

export type PortainerSelectProps<TValue> =
  | MultiProps<TValue>
  | SingleProps<TValue>;

export function PortainerSelect<TValue = string>(
  props: PortainerSelectProps<TValue>
) {
  return isMultiProps(props) ? (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <MultiSelect {...props} />
  ) : (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SingleSelect {...props} />
  );
}

function isMultiProps<TValue>(
  props: PortainerSelectProps<TValue>
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
  filterOption,
  components,
  isLoading,
  noOptionsMessage,
  loadingMessage,
  isMulti,
  size,
  getOptionValue,
  onBlur,
  ...aria
}: SingleProps<TValue>) {
  const selectedValue =
    value ||
    (typeof value === 'number' && value === 0) ||
    (typeof value === 'string' && value === '')
      ? _.first(findSelectedOptions<TValue>(options, value, getOptionValue))
      : null;

  return (
    <ReactSelect<Option<TValue>>
      name={name}
      isClearable={isClearable}
      getOptionLabel={(option) => option.label}
      getOptionValue={(option) =>
        getOptionValue ? getOptionValue(option.value) : String(option.value)
      }
      options={options}
      value={selectedValue}
      onChange={(option) => onChange(option ? option.value : null)}
      isOptionDisabled={(option) => !!option.disabled}
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
      isDisabled={disabled}
      menuPortalTarget={bindToBody ? document.body : undefined}
      filterOption={filterOption}
      components={components}
      isLoading={isLoading}
      noOptionsMessage={noOptionsMessage}
      size={size}
      loadingMessage={loadingMessage}
      onBlur={onBlur}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...aria}
    />
  );
}

function isSingleValue<TValue>(
  value: TValue | readonly TValue[]
): value is TValue {
  return !Array.isArray(value);
}

function findSelectedOptions<TValue>(
  options: Options<TValue>,
  value: TValue | readonly TValue[],
  getOptionValue: (option: TValue) => string | TValue = (v: TValue) => v
) {
  const valueArr = isSingleValue(value)
    ? [getOptionValue(value)]
    : value.map((v) => getOptionValue(v));

  const values = _.compact(
    options.flatMap((option) => {
      if (isGroup(option)) {
        return option.options.find((opt) =>
          valueArr.includes(getOptionValue(opt.value))
        );
      }

      if (valueArr.includes(getOptionValue(option.value))) {
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
  filterOption,
  components,
  isLoading,
  noOptionsMessage,
  loadingMessage,
  formatCreateLabel,
  onCreateOption,
  isCreatable,
  size,
  getOptionValue,
  onBlur,
  ...aria
}: Omit<MultiProps<TValue>, 'isMulti'>) {
  const [inputValue, setInputValue] = useState('');
  const selectedOptions = findSelectedOptions(options, value, getOptionValue);
  const SelectComponent = isCreatable ? Creatable : ReactSelect;

  return (
    <SelectComponent
      name={name}
      isMulti
      isClearable={isClearable}
      getOptionLabel={(option) => option.label}
      getOptionValue={(option) =>
        getOptionValue ? getOptionValue(option.value) : String(option.value)
      }
      isOptionDisabled={(option) => !!option.disabled}
      options={options}
      value={selectedOptions}
      closeMenuOnSelect={false}
      onChange={(newValue) => {
        onChange(newValue.map((option) => option.value));
        setInputValue('');
      }}
      data-cy={dataCy}
      id={dataCy}
      inputId={inputId}
      placeholder={placeholder}
      isDisabled={disabled}
      menuPortalTarget={bindToBody ? document.body : undefined}
      filterOption={filterOption}
      components={components}
      isLoading={isLoading}
      noOptionsMessage={noOptionsMessage}
      loadingMessage={loadingMessage}
      formatCreateLabel={formatCreateLabel}
      onCreateOption={onCreateOption}
      inputValue={inputValue}
      onInputChange={(textInput) => setInputValue(textInput)}
      onBlur={handleBlur}
      size={size}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...aria}
    />
  );

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    onBlur?.(e);
    const trimmed = inputValue.trim();
    if (!trimmed || value.includes(trimmed as TValue)) {
      setInputValue('');
      return;
    }
    if (onCreateOption && isCreatable) {
      onCreateOption(trimmed);
    } else {
      onChange([...value, trimmed as TValue]);
    }
    setInputValue('');
  }
}

function isGroup<TValue>(
  option: Option<TValue> | GroupBase<Option<TValue>>
): option is GroupBase<Option<TValue>> {
  return 'options' in option;
}
