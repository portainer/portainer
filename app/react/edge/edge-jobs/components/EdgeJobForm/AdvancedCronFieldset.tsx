import { useField } from 'formik';
import { string } from 'yup';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { TimeTip } from './TimeTip';

export function AdvancedCronFieldset() {
  const [{ value, onChange, name, onBlur }, { error }] =
    useField<string>('cronExpression');

  return (
    <>
      <FormControl label="Cron rule" inputId="edge_job_cron" errors={error}>
        <Input
          data-cy="edge-job-cron-input"
          id="edge_job_cron"
          placeholder="e.g. 0 2 * * *"
          required
          value={value}
          onChange={onChange}
          name={name}
          onBlur={onBlur}
        />
      </FormControl>

      <TimeTip />
    </>
  );
}
/** https://regexr.com/573i2 */
const cronRegex =
  /(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ){4,6}((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*))/;

export function cronValidation() {
  return string()
    .default('')
    .matches(cronRegex, 'This field format is invalid.');
}
