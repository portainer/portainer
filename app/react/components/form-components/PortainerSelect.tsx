import {
  GroupBase,
  OptionsOrGroups,
  SelectComponentsConfig,
} from 'react-select';
import _ from 'lodash';
import { AriaAttributes } from 'react';
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
      id={dataCy}
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
  filterOption,
  components,
  isLoading,
  noOptionsMessage,
  size,
  loadingMessage,
  formatCreateLabel,
  onCreateOption,
  isCreatable,
  ...aria
}: Omit<MultiProps<TValue>, 'isMulti'>) {
  const selectedOptions = findSelectedOptions(options, value);
  const SelectComponent = isCreatable ? Creatable : ReactSelect;
  return (
    <SelectComponent
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
      id={dataCy}
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
      formatCreateLabel={formatCreateLabel}
      onCreateOption={onCreateOption}
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
