import { useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';

export const defaultCronExpression = '0 * * * *' as const;

export const timeOptions = [
  {
    label: 'Every hour',
    value: defaultCronExpression,
  },
  {
    label: 'Every 2 hours',
    value: '0 */2 * * *',
  },
  {
    label: 'Every day',
    value: '0 0 * * *',
  },
] as const;

export function RecurringFieldset() {
  const [{ value, onChange, name, onBlur }, { error }] =
    useField<string>('recurringOption');

  return (
    <FormControl label="Edge job time" inputId="edge_job_value" errors={error}>
      <Select
        id="edge_job_value"
        data-cy="edge-job-time-select"
        name={name}
        options={timeOptions}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
    </FormControl>
  );
}
