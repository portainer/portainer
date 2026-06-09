import type { ReactNode } from 'react';
import {
  components,
  type GroupBase,
  type MultiValueProps,
  type MultiValueRemoveProps,
} from 'react-select';

import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { type Option } from './PortainerSelect';

/** Extends Option with an optional tooltip shown when the item is disabled. */
export interface DisabledOption<TValue> extends Option<TValue> {
  disabledMessage?: ReactNode;
}

export function DisabledMultiValue({
  data,
  ...props
}: MultiValueProps<Option<string>, true, GroupBase<Option<string>>>) {
  const disabledMessage = (data as DisabledOption<string>).disabledMessage;

  const value = (
    <components.MultiValue
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      data={data}
      isDisabled={!!data.disabled}
    >
      <span className={data.disabled ? 'text-muted pr-1' : ''}>
        {props.children}
      </span>
    </components.MultiValue>
  );

  if (data.disabled && disabledMessage) {
    return (
      <TooltipWithChildren
        message={disabledMessage}
        appendTo={() => document.body}
      >
        <span>{value}</span>
      </TooltipWithChildren>
    );
  }

  return value;
}

export function DisabledMultiValueRemove({
  data,
  ...props
}: MultiValueRemoveProps<Option<string>, true, GroupBase<Option<string>>>) {
  if (data.disabled) {
    return null;
  }

  return (
    <components.MultiValueRemove
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      data={data}
    />
  );
}

export function preserveProtectedValues<T>(
  selectedValues: T[],
  protectedValues: T[]
): T[] {
  return [...new Set([...selectedValues, ...protectedValues])];
}
