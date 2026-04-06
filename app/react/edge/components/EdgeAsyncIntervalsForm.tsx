import { number, object, SchemaOf } from 'yup';
import { useTranslation, TFunction } from 'react-i18next';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';

import { Options, useIntervalOptions } from './useIntervalOptions';

export const EDGE_ASYNC_INTERVAL_USE_DEFAULT = -1;

export interface EdgeAsyncIntervalsValues {
  PingInterval: number;
  SnapshotInterval: number;
  CommandInterval: number;
}

export const asyncIntervalValues = [
  -1,
  0,
  60,
  60 * 60,
  24 * 60 * 60,
  7 * 24 * 60 * 60,
];

function getOptions(t: TFunction): Options {
  return [
    { label: t('edge.use_default_interval'), value: -1, isDefault: true },
    { value: 0, label: t('edge.disabled') },
    { value: 60, label: t('edge.1_minute') },
    { value: 60 * 60, label: t('edge.1_hour') },
    { value: 24 * 60 * 60, label: t('edge.1_day') },
    { value: 7 * 24 * 60 * 60, label: t('edge.1_week') },
  ];
}

type FieldSettings = {
  ping: { label: string; tooltip: string };
  snapshot: { label: string; tooltip: string };
  command: { label: string; tooltip: string };
};

function getDefaultFieldSettings(t: TFunction): FieldSettings {
  return {
    ping: {
      label: t('edge.ping_interval'),
      tooltip: t('edge.ping_interval_tooltip'),
    },
    snapshot: {
      label: t('edge.snapshot_interval'),
      tooltip: t('edge.snapshot_interval_tooltip'),
    },
    command: {
      label: t('edge.command_interval'),
      tooltip: t('edge.command_interval_tooltip'),
    },
  };
}

interface Props {
  values: EdgeAsyncIntervalsValues;
  isDefaultHidden?: boolean;
  readonly?: boolean;
  fieldSettings?: FieldSettings;
  onChange(value: EdgeAsyncIntervalsValues): void;
}

export function EdgeAsyncIntervalsForm({
  onChange,
  values,
  isDefaultHidden = false,
  readonly = false,
  fieldSettings,
}: Props) {
  const { t } = useTranslation();
  const options = getOptions(t);
  const resolvedFieldSettings = fieldSettings ?? getDefaultFieldSettings(t);

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
        label={resolvedFieldSettings.ping.label}
        tooltip={resolvedFieldSettings.ping.tooltip}
      >
        <Select
          id="edge_checkin_ping"
          value={values.PingInterval}
          data-cy="edge-checkin-ping-interval-select"
          name="PingInterval"
          onChange={handleChange}
          options={pingIntervalOptions}
          disabled={readonly}
        />
      </FormControl>

      <FormControl
        inputId="edge_checkin_snapshot"
        label={resolvedFieldSettings.snapshot.label}
        tooltip={resolvedFieldSettings.snapshot.tooltip}
      >
        <Select
          id="edge_checkin_snapshot"
          value={values.SnapshotInterval}
          data-cy="edge-checkin-snapshot-interval-select"
          name="SnapshotInterval"
          onChange={handleChange}
          options={snapshotIntervalOptions}
          disabled={readonly}
        />
      </FormControl>

      <FormControl
        inputId="edge_checkin_command"
        label={resolvedFieldSettings.command.label}
        tooltip={resolvedFieldSettings.command.tooltip}
      >
        <Select
          id="edge_checkin_command"
          value={values.CommandInterval}
          data-cy="edge-checkin-command-interval-select"
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

export function edgeAsyncIntervalsValidation(): SchemaOf<EdgeAsyncIntervalsValues> {
  return object({
    PingInterval: number()
      .required('This field is required.')
      .oneOf(asyncIntervalValues),
    SnapshotInterval: number()
      .required('This field is required.')
      .oneOf(asyncIntervalValues),
    CommandInterval: number()
      .required('This field is required.')
      .oneOf(asyncIntervalValues),
  });
}
