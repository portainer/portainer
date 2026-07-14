import parse from 'parse-duration';

import { durationValidation } from '@/react/utils/validation';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { useCaretPosition } from '@@/form-components/useCaretPosition';

export function IntervalField({
  onChange,
  value,
  errors,
}: {
  value: string;
  onChange: (value: string) => void;
  errors?: string;
}) {
  const { ref, updateCaret } = useCaretPosition();

  return (
    <FormControl
      label="Fetch interval"
      inputId="repository_fetch_interval"
      tooltip="Specify how frequently polling occurs using syntax such as, 5m = 5 minutes, 24h = 24 hours, 6h40m = 6 hours and 40 minutes."
      required
      errors={errors}
    >
      <Input
        mRef={ref}
        data-cy="repository-fetch-interval-input"
        id="repository_fetch_interval"
        name="repository_fetch_interval"
        placeholder="5m"
        required
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          updateCaret();
        }}
      />
    </FormControl>
  );
}

export function intervalValidation() {
  return durationValidation(false) // Don't allow empty - field is required
    .required('This field is required.')
    .test('minimumInterval', 'Minimum interval is 1m', (value) => {
      if (!value) {
        return false;
      }
      const minutes = parse(value, 'minute');
      return minutes !== null && minutes >= 1;
    });
}
