import { useField } from 'formik';
import DateTimePicker from 'react-datetime-picker';
import { Calendar, X } from 'lucide-react';
import { useMemo } from 'react';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { FormValues } from './types';

interface Props {
  disabled?: boolean;
}

export function ScheduledTimeField({ disabled }: Props) {
  const [{ name, value }, { error }, { setValue }] =
    useField<FormValues['time']>('time');

  const dateValue = useMemo(() => new Date(value * 1000), [value]);

  return (
    <FormControl label="Schedule date & time" errors={error}>
      {!disabled ? (
        <DateTimePicker
          format="y-MM-dd HH:mm:ss"
          minDate={new Date()}
          className="form-control [&>div]:border-0"
          onChange={(date) => setValue(Math.floor(date.getTime() / 1000))}
          name={name}
          value={dateValue}
          calendarIcon={<Calendar className="lucide" />}
          clearIcon={<X className="lucide" />}
          disableClock
        />
      ) : (
        <Input defaultValue={isoDateFromTimestamp(value)} disabled />
      )}
    </FormControl>
  );
}
