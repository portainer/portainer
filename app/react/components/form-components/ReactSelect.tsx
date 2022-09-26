import ReactSelectCreatable, {
  CreatableProps as ReactSelectCreatableProps,
} from 'react-select/creatable';
import ReactSelect, {
  GroupBase,
  Props as ReactSelectProps,
} from 'react-select';
import clsx from 'clsx';
import { RefAttributes } from 'react';
import ReactSelectType from 'react-select/dist/declarations/src/Select';

import './ReactSelect.css';

interface DefaultOption {
  value: string;
  label: string;
}

type RegularProps<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> = { isCreatable?: false } & ReactSelectProps<Option, IsMulti, Group> &
  RefAttributes<ReactSelectType<Option, IsMulti, Group>>;

type CreatableProps<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> = { isCreatable: true } & ReactSelectCreatableProps<Option, IsMulti, Group>;

type Props<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> =
  | CreatableProps<Option, IsMulti, Group>
  | RegularProps<Option, IsMulti, Group>;

export function Select<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({ className, isCreatable = false, ...props }: Props<Option, IsMulti, Group>) {
  const Component = isCreatable ? ReactSelectCreatable : ReactSelect;

  return (
    <Component
      className={clsx(className, 'portainer-selector-root')}
      classNamePrefix="portainer-selector"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}

export function Creatable<
  Option = DefaultOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
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
