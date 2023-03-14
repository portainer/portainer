import { string } from 'yup';
import parse from 'parse-duration';

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
  return (
    string()
      .required('This field is required.')
      // TODO: find a regex that validates time.Duration
      // .matches(
      //   // validate golang time.Duration format
      //   // https://cs.opensource.google/go/go/+/master:src/time/format.go;l=1590
      //   /[-+]?([0-9]*(\.[0-9]*)?[a-z]+)+/g,
      //   'Please enter a valid time interval.'
      // )
      .test(
        'minimumInterval',
        'Minimum interval is 1m',
        (value) => !!value && parse(value, 'minute') >= 1
      )
  );
}
