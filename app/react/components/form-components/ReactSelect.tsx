import ReactSelectCreatable, { CreatableProps } from 'react-select/creatable';
import ReactSelect, { GroupBase, Props as SelectProps } from 'react-select';
import clsx from 'clsx';
import { RefAttributes } from 'react';
import ReactSelectType from 'react-select/dist/declarations/src/Select';

import styles from './ReactSelect.module.css';

export function Select<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({
  className,
  ...props
}: SelectProps<Option, IsMulti, Group> &
  RefAttributes<ReactSelectType<Option, IsMulti, Group>>) {
  return (
    <ReactSelect
      className={clsx(styles.root, className)}
      classNamePrefix="selector"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}

export function Creatable<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({ className, ...props }: CreatableProps<Option, IsMulti, Group>) {
  return (
    <ReactSelectCreatable
      className={clsx(styles.root, className)}
      classNamePrefix="selector"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}
