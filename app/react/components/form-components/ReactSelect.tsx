import ReactSelectCreatable, {
  CreatableProps as ReactSelectCreatableProps,
} from 'react-select/creatable';
import ReactSelectAsync, {
  AsyncProps as ReactSelectAsyncProps,
} from 'react-select/async';
import ReactSelect, {
  GroupBase,
  OptionsOrGroups,
  Props as ReactSelectProps,
} from 'react-select';
import clsx from 'clsx';
import { RefAttributes, useMemo } from 'react';
import ReactSelectType from 'react-select/dist/declarations/src/Select';

import './ReactSelect.css';
import { AutomationTestingProps } from '@/types';

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
  }) {
  const Component = isCreatable ? ReactSelectCreatable : ReactSelect;
  const { options } = props;

  if ((options?.length || 0) > 1000) {
    return (
      <TooManyResultsSelector
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        size={size}
      />
    );
  }

  return (
    <Component
      className={clsx(className, 'portainer-selector-root', size)}
      classNamePrefix="portainer-selector"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}

export function Creatable<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>({ className, ...props }: ReactSelectCreatableProps<Option, IsMulti, Group>) {
  return (
    <ReactSelectCreatable
      className={clsx(className, 'portainer-selector-root')}
      classNamePrefix="portainer-selector"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
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
}: ReactSelectAsyncProps<Option, IsMulti, Group> & { size?: 'sm' | 'md' }) {
  return (
    <ReactSelectAsync
      className={clsx(className, 'portainer-selector-root', size)}
      classNamePrefix="portainer-selector"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
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
  isItemVisible = (item, search) =>
    !!getOptionValue?.(item).toLowerCase().includes(search.toLowerCase()),
  ...props
}: RegularProps<Option, IsMulti, Group> & {
  isItemVisible?: (item: Option, search: string) => boolean;
}) {
  const defaultOptions = useMemo(() => options?.slice(0, 100), [options]);

  return (
    <Async
      isLoading={isLoading}
      getOptionValue={getOptionValue}
      loadOptions={(search: string) =>
        filterOptions<Option, Group>(options, isItemVisible, search)
      }
      defaultOptions={defaultOptions}
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
  search: string
): Promise<OptionsOrGroups<Option, Group> | undefined> {
  return Promise.resolve<OptionsOrGroups<Option, Group> | undefined>(
    options
      ?.filter((item) =>
        isGroup(item)
          ? item.options.some((ni) => isItemVisible(ni, search))
          : isItemVisible(item, search)
      )
      .slice(0, 100)
  );
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
