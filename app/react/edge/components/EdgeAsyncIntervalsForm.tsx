import { number, object, SchemaOf } from 'yup';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';

import { Options, useIntervalOptions } from './useIntervalOptions';

export const EDGE_ASYNC_INTERVAL_USE_DEFAULT = -1;

export interface EdgeAsyncIntervalsValues {
  PingInterval: number;
  SnapshotInterval: number;
  CommandInterval: number;
}

export const options: Options = [
  { label: 'Use default interval', value: -1, isDefault: true },
  {
    value: 0,
    label: 'disabled',
  },
  {
    value: 60,
    label: '1 minute',
  },
  {
    value: 60 * 60,
    label: '1 hour',
  },
  {
    value: 24 * 60 * 60,
    label: '1 day',
  },
  {
    value: 7 * 24 * 60 * 60,
    label: '1 week',
  },
];

const defaultFieldSettings = {
  ping: {
    label: 'Ping interval',
    tooltip:
      'Interval used by this Edge agent to check in with the Portainer instance',
  },
  snapshot: {
    label: 'Snapshot interval',
    tooltip: 'Interval used by this Edge agent to snapshot the agent state',
  },
  command: {
    label: 'Command interval',
    tooltip:
      'Interval used by this Edge agent to fetch commands from the Portainer instance',
  },
};

interface Props {
  values: EdgeAsyncIntervalsValues;
  isDefaultHidden?: boolean;
  readonly?: boolean;
  fieldSettings?: typeof defaultFieldSettings;
  onChange(value: EdgeAsyncIntervalsValues): void;
}

export function EdgeAsyncIntervalsForm({
  onChange,
  values,
  isDefaultHidden = false,
  readonly = false,
  fieldSettings = defaultFieldSettings,
}: Props) {
  const pingIntervalOptions = useIntervalOptions(
    'Edge.PingInterval',
    options,
    isDefaultHidden
  );

  const snapshotIntervalOptions = useIntervalOptions(
    'Edge.SnapshotInterval',
    options,
    isDefaultHidden
  );

  const commandIntervalOptions = useIntervalOptions(
    'Edge.CommandInterval',
    options,
    isDefaultHidden
  );

  return (
    <>
      <FormControl
        inputId="edge_checkin_ping"
        label={fieldSettings.ping.label}
        tooltip={fieldSettings.ping.tooltip}
      >
        <Select
          value={values.PingInterval}
          name="PingInterval"
          onChange={handleChange}
          options={pingIntervalOptions}
          disabled={readonly}
        />
      </FormControl>

      <FormControl
        inputId="edge_checkin_snapshot"
        label={fieldSettings.snapshot.label}
        tooltip={fieldSettings.snapshot.tooltip}
      >
        <Select
          value={values.SnapshotInterval}
          name="SnapshotInterval"
          onChange={handleChange}
          options={snapshotIntervalOptions}
          disabled={readonly}
        />
      </FormControl>

      <FormControl
        inputId="edge_checkin_command"
        label={fieldSettings.command.label}
        tooltip={fieldSettings.command.tooltip}
      >
        <Select
          value={values.CommandInterval}
          name="CommandInterval"
          onChange={handleChange}
          options={commandIntervalOptions}
          disabled={readonly}
        />
      </FormControl>
    </>
  );

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...values, [e.target.name]: parseInt(e.target.value, 10) });
  }
}

const intervals = options.map((option) => option.value);

export function edgeAsyncIntervalsValidation(): SchemaOf<EdgeAsyncIntervalsValues> {
  return object({
    PingInterval: number().required('This field is required.').oneOf(intervals),
    SnapshotInterval: number()
      .required('This field is required.')
      .oneOf(intervals),
    CommandInterval: number()
      .required('This field is required.')
      .oneOf(intervals),
  });
}
