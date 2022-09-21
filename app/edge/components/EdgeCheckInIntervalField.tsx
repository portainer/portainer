import { useEffect, useState } from 'react';

import { r2a } from '@/react-tools/react2angular';
import { useSettings } from '@/react/portainer/settings/queries';
import { withReactQuery } from '@/react-tools/withReactQuery';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';

interface Props {
  value: number;
  onChange(value: number): void;
  isDefaultHidden?: boolean;
  label?: string;
  tooltip?: string;
  readonly?: boolean;
}

export const checkinIntervalOptions = [
  { label: 'Use default interval', value: 0 },
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
}: Props) {
  const options = useOptions(isDefaultHidden);

  return (
    <FormControl inputId="edge_checkin" label={label} tooltip={tooltip}>
      <Select
        value={value}
        onChange={(e) => {
          onChange(parseInt(e.currentTarget.value, 10));
        }}
        options={options}
        disabled={readonly}
      />
    </FormControl>
  );
}

export const EdgeCheckinIntervalFieldAngular = r2a(
  withReactQuery(EdgeCheckinIntervalField),
  ['value', 'onChange', 'isDefaultHidden', 'tooltip', 'label', 'readonly']
);

function useOptions(isDefaultHidden: boolean) {
  const [options, setOptions] = useState(checkinIntervalOptions);

  const settingsQuery = useSettings(
    (settings) => settings.EdgeAgentCheckinInterval
  );

  useEffect(() => {
    if (isDefaultHidden) {
      setOptions(checkinIntervalOptions.filter((option) => option.value !== 0));
    }

    if (!isDefaultHidden && typeof settingsQuery.data !== 'undefined') {
      setOptions((options) => {
        let label = `${settingsQuery.data} seconds`;
        const option = options.find((o) => o.value === settingsQuery.data);
        if (option) {
          label = option.label;
        }

        return [
          {
            value: 0,
            label: `Use default interval (${label})`,
          },
          ...options.slice(1),
        ];
      });
    }
  }, [settingsQuery.data, setOptions, isDefaultHidden]);

  return options;
}
