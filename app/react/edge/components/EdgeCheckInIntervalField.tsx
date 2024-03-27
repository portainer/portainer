import { FormControl, Size } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';

import { Options, useIntervalOptions } from './useIntervalOptions';

interface Props {
  value: number;
  onChange(value: number): void;
  isDefaultHidden?: boolean;
  label?: string;
  tooltip?: string;
  readonly?: boolean;
  size?: Size;
}

export const checkinIntervalOptions: Options = [
  { label: 'Use default interval', value: 0, isDefault: true },
  {
    label: '5 seconds',
    value: 5,
  },
  {
    label: '10 seconds',
    value: 10,
  },
  {
    label: '30 seconds',
    value: 30,
  },
  { label: '5 minutes', value: 300 },
  { label: '1 hour', value: 3600 },
  { label: '1 day', value: 86400 },
];

export function EdgeCheckinIntervalField({
  value,
  readonly,
  onChange,
  isDefaultHidden = false,
  label = 'Poll frequency',
  tooltip = 'Interval used by this Edge agent to check in with the Portainer instance. Affects Edge environment management and Edge compute features.',
  size = 'small',
}: Props) {
  const options = useIntervalOptions(
    'EdgeAgentCheckinInterval',
    checkinIntervalOptions,
    isDefaultHidden
  );

  return (
    <FormControl
      inputId="edge_checkin"
      label={label}
      tooltip={tooltip}
      size={size}
    >
      <Select
        value={value}
        data-cy="edge-checkin-interval-select"
        onChange={(e) => {
          onChange(parseInt(e.currentTarget.value, 10));
        }}
        options={options}
        disabled={readonly}
        id="edge_checkin"
      />
    </FormControl>
  );
}
