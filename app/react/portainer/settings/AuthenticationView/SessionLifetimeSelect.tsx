import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';

const sessionLifetimeOptions = [
  {
    key: '30 minutes',
    value: '30m',
  },
  {
    key: '1 hour',
    value: '1h',
  },
  {
    key: '4 hours',
    value: '4h',
  },
  {
    key: '8 hours',
    value: '8h',
  },
  {
    key: '24 hours',
    value: '24h',
  },
  { key: '1 week', value: `${24 * 7}h` },
  { key: '1 month', value: `${24 * 30}h` },
  { key: '6 months', value: `${24 * 30 * 6}h` },
  { key: '1 year', value: `${24 * 30 * 12}h` },
] as const;

export function getDefaultValue() {
  return sessionLifetimeOptions[0];
}

interface Props {
  value: string;
  onChange(value: string): void;
}

export function SessionLifetimeSelect({ value, onChange }: Props) {
  return (
    <FormControl
      inputId="user_timeout"
      label="Session lifetime"
      tooltip="Time before users are forced to relogin."
    >
      <Select
        id="user_timeout"
        data-cy="user-timeout-select"
        name="user_timeout"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={sessionLifetimeOptions.map((opt) => ({
          label: opt.key,
          value: opt.value,
        }))}
      />
    </FormControl>
  );
}
