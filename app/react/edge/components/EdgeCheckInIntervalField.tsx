import { useTranslation, TFunction } from 'react-i18next';

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

function getCheckinIntervalOptions(t: TFunction): Options {
  return [
    { label: t('edge.use_default_interval'), value: 0, isDefault: true },
    { label: t('edge.5_seconds'), value: 5 },
    { label: t('edge.10_seconds'), value: 10 },
    { label: t('edge.30_seconds'), value: 30 },
    { label: t('edge.5_minutes'), value: 300 },
    { label: t('edge.1_hour'), value: 3600 },
    { label: t('edge.1_day'), value: 86400 },
  ];
}

export function EdgeCheckinIntervalField({
  value,
  readonly,
  onChange,
  isDefaultHidden = false,
  label,
  tooltip,
  size = 'small',
}: Props) {
  const { t } = useTranslation();
  const checkinIntervalOptions = getCheckinIntervalOptions(t);
  const resolvedLabel = label ?? t('edge.poll_frequency');
  const resolvedTooltip = tooltip ?? t('edge.poll_frequency_tooltip');

  const options = useIntervalOptions(
    'EdgeAgentCheckinInterval',
    checkinIntervalOptions,
    isDefaultHidden
  );

  return (
    <FormControl
      inputId="edge_checkin"
      label={resolvedLabel}
      tooltip={resolvedTooltip}
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
