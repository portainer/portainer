import {
  GroupBase,
  OptionProps,
  SingleValueProps,
  SelectComponentsConfig,
  components,
} from 'react-select';
import { ReactNode } from 'react';

import { Option } from './PortainerSelect';

export function CustomComponents<TValue>(
  render: (data: Option<TValue>) => ReactNode
): SelectComponentsConfig<Option<TValue>, false, GroupBase<Option<TValue>>> {
  return {
    Option: CustomOption(render),
    SingleValue: CustomSingleValue(render),
  };
}

function CustomOption<TValue>(render: (data: Option<TValue>) => ReactNode) {
  return function CustomOptionRenderer({
    data,
    ...props
  }: OptionProps<Option<TValue>, false, GroupBase<Option<TValue>>>) {
    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <components.Option data={data} {...props}>
        {render(data)}
      </components.Option>
    );
  };
}

function CustomSingleValue<TValue>(
  render: (data: Option<TValue>) => ReactNode
) {
  return function CustomOptionRenderer({
    data,
    ...props
  }: SingleValueProps<Option<TValue>, false, GroupBase<Option<TValue>>>) {
    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <components.SingleValue data={data} {...props}>
        {render(data)}
      </components.SingleValue>
    );
  };
}
