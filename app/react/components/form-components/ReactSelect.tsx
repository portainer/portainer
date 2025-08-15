import ReactSelectCreatable, {
  CreatableProps as ReactSelectCreatableProps,
} from 'react-select/creatable';
import {
  AsyncPaginate as ReactSelectAsyncPaginate,
  AsyncPaginateProps as ReactSelectAsyncPaginateProps,
} from 'react-select-async-paginate';
import ReactSelect, {
  components,
  GroupBase,
  InputProps,
  OptionsOrGroups,
  Props as ReactSelectProps,
} from 'react-select';
import clsx from 'clsx';
import { RefAttributes, useMemo, useCallback } from 'react';
import ReactSelectType from 'react-select/dist/declarations/src/Select';

import './ReactSelect.css';
import { AutomationTestingProps } from '@/types';

const PAGE_SIZE = 100;
const MAX_OPTIONS_WITHOUT_PAGINATION = 1000;

interface DefaultOption {
  value: string;
  label: string;
}

type RegularProps<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> = { isCreatable?: false; size?: 'sm' | 'md' } & ReactSelectProps<
  Option,
  IsMulti,
  Group
> &
  RefAttributes<ReactSelectType<Option, IsMulti, Group>> &
  AutomationTestingProps;

type CreatableProps<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> = { isCreatable: true; size?: 'sm' | 'md' } & ReactSelectCreatableProps<
  Option,
  IsMulti,
  Group
> &
  AutomationTestingProps;

type Props<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> =
  | CreatableProps<Option, IsMulti, Group>
  | RegularProps<Option, IsMulti, Group>;

/**
 * DO NOT use this component directly, use PortainerSelect instead.
 */
export function Select<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>({
  className,
  isCreatable = false,
  size = 'md',

  ...props
}: Props<Option, IsMulti, Group> &
  AutomationTestingProps & {
    isItemVisible?: (item: Option, search: string) => boolean;
    id: string;
  }) {
  const Component = isCreatable ? ReactSelectCreatable : ReactSelect;
  const {
    options,
    'data-cy': dataCy,
    components: componentsProp,
    ...rest
  } = props;

  const memoizedComponents = useMemoizedSelectComponents<
    Option,
    IsMulti,
    Group
  >(dataCy, componentsProp);

  if ((options?.length || 0) > MAX_OPTIONS_WITHOUT_PAGINATION) {
    return (
      <TooManyResultsSelector
        size={size}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
    );
  }

  return (
    <Component
      options={options}
      className={clsx(className, 'portainer-selector-root', size)}
      classNamePrefix="portainer-selector"
      components={memoizedComponents}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    />
  );
}

export function Creatable<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>({
  className,
  ...props
}: ReactSelectCreatableProps<Option, IsMulti, Group> & AutomationTestingProps) {
  const { 'data-cy': dataCy, components: componentsProp, ...rest } = props;

  const memoizedComponents = useMemoizedSelectComponents<
    Option,
    IsMulti,
    Group
  >(dataCy, componentsProp);

  return (
    <ReactSelectCreatable
      className={clsx(className, 'portainer-selector-root')}
      classNamePrefix="portainer-selector"
      components={memoizedComponents}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    />
  );
}

export function Async<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>({
  className,
  size,
  ...props
}: ReactSelectAsyncPaginateProps<Option, Group, unknown, IsMulti> & {
  size?: 'sm' | 'md';
} & AutomationTestingProps) {
  const { 'data-cy': dataCy, components: componentsProp, ...rest } = props;

  const memoizedComponents = useMemoizedSelectComponents<
    Option,
    IsMulti,
    Group
  >(dataCy, componentsProp);

  return (
    <ReactSelectAsyncPaginate
      className={clsx(className, 'portainer-selector-root', size)}
      classNamePrefix="portainer-selector"
      components={memoizedComponents}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    />
  );
}

export function TooManyResultsSelector<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>({
  options,
  isLoading,
  getOptionValue,
  getOptionLabel,
  isItemVisible = (item, search) =>
    search.trim() === '' ||
    !!getOptionLabel?.(item).toLowerCase().includes(search.toLowerCase()),
  ...props
}: RegularProps<Option, IsMulti, Group> & {
  isItemVisible?: (item: Option, search: string) => boolean;
}) {
  return (
    <Async
      isLoading={isLoading}
      getOptionValue={getOptionValue}
      loadOptions={(
        search: string,
        loadedOptions: OptionsOrGroups<Option, Group> | undefined
      ) =>
        filterOptions<Option, Group>(
          options,
          isItemVisible,
          search,
          loadedOptions
        )
      }
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}

function filterOptions<
  Option = DefaultOption,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  options: OptionsOrGroups<Option, Group> | undefined,
  isItemVisible: (item: Option, search: string) => boolean,
  search: string,
  loadedOptions?: OptionsOrGroups<Option, Group>
) {
  const filteredOptions = options?.filter((item) =>
    isGroup(item)
      ? item.options.some((ni) => isItemVisible(ni, search))
      : isItemVisible(item, search)
  );

  const offset = loadedOptions?.length ?? 0;

  return {
    options: filteredOptions?.slice(offset, offset + PAGE_SIZE) ?? [],
    hasMore: (filteredOptions?.length ?? 0) > offset + PAGE_SIZE,
  };
}

function isGroup<
  Option = DefaultOption,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(option: Option | Group): option is Group {
  if (!option) {
    return false;
  }

  if (typeof option !== 'object') {
    return false;
  }

  return 'options' in option;
}

/**
 * Memoize components to prevent unnecessary re-renders.
 */
function useMemoizedSelectComponents<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  dataCy: string | undefined,
  componentsProp: Partial<
    ReactSelectProps<Option, IsMulti, Group>['components']
  >
) {
  const customInput = useCallback(
    (inputProps: InputProps<Option, IsMulti, Group>) =>
      components.Input({ ...inputProps, 'data-cy': dataCy }),
    [dataCy]
  );

  const memoizedComponents = useMemo(
    () => ({
      Input: customInput,
      ...componentsProp,
    }),
    [customInput, componentsProp]
  );

  return memoizedComponents;
}
