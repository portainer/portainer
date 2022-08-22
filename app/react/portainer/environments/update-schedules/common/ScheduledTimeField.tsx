import { useField } from 'formik';
import DateTimePicker from 'react-datetime-picker';
import { Calendar, X } from 'react-feather';

import { FormControl } from '@@/form-components/FormControl';

import { FormValues } from './types';

export function ScheduledTimeField() {
  const [{ name, value }, { error }, { setValue }] =
    useField<FormValues['time']>('time');

  return (
    <FormControl label="Schedule date & time" errors={error}>
      <DateTimePicker
        format="y-MM-dd HH:mm:ss"
        minDate={new Date()}
        className="form-control [&>div]:border-0"
        onChange={(date) => setValue(Math.floor(date.getTime() / 1000))}
        name={name}
        value={new Date(value * 1000)}
        calendarIcon={<Calendar className="feather" />}
        clearIcon={<X className="feather" />}
      />
    </FormControl>
  );
}
