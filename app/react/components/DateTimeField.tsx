import DateTimePicker from 'react-datetime-picker';
import { Calendar, X } from 'lucide-react';

import { isoDate } from '@/portainer/filters/filters';
import { AutomationTestingProps } from '@/types';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';

export const FORMAT = 'YYYY-MM-DD HH:mm';

export function DateTimeField({
  error,
  label,
  disabled,
  name,
  value,
  onChange,
  minDate,
  'data-cy': dataCy,
}: {
  error?: string;
  disabled?: boolean;
  name: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  label: string;
  minDate?: Date;
} & AutomationTestingProps) {
  return (
    <FormControl label={label} errors={error}>
      {!disabled ? (
        <DateTimePicker
          format="y-MM-dd HH:mm"
          className="form-control [&>div]:border-0"
          name={name}
          value={value}
          onChange={onChange}
          calendarIcon={<Calendar className="lucide" />}
          clearIcon={<X className="lucide" />}
          disableClock
          data-cy={dataCy}
          minDate={minDate}
        />
      ) : (
        <Input
          defaultValue={isoDate(value?.valueOf(), FORMAT)}
          disabled
          data-cy={`${dataCy}-disabled-value`}
        />
      )}
    </FormControl>
  );
}
