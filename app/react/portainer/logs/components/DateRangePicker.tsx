import WojtekmajRangePicker from '@wojtekmaj/react-daterange-picker';
import { Calendar, X } from 'lucide-react';
import { date, object, SchemaOf } from 'yup';
import { FormikErrors } from 'formik';

import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css';
import 'react-calendar/dist/Calendar.css';

import { FormControl } from '@@/form-components/FormControl';

import 'react-datetime-picker/dist/DateTimePicker.css';

type Value = { start: Date; end: Date | null };

export function DateRangePicker({
  value,
  onChange,
  name,
  error,
}: {
  value: Value | undefined;
  onChange: (value?: Value) => void;
  name?: string;
  error?: FormikErrors<Value>;
}) {
  return (
    <FormControl label="Date range" errors={error}>
      <div className="w-1/2">
        <WojtekmajRangePicker
          format="y-MM-dd"
          className="form-control [&>div]:border-0"
          value={value ? [value.start, value.end] : null}
          onChange={(date) => {
            if (!date) {
              onChange(undefined);
              return;
            }
            if (Array.isArray(date)) {
              if (date.length === 2 && date[0] && date[1]) {
                onChange({
                  start: date[0],
                  end: date[1],
                });
                return;
              }
              onChange(undefined);
              return;
            }
            onChange({ start: date, end: null });
          }}
          name={name}
          calendarIcon={<Calendar />}
          clearIcon={<X />}
        />
      </div>
    </FormControl>
  );
}

export function dateRangePickerValidation(): SchemaOf<Value> {
  return object({
    start: date().required(),
    end: date().nullable().default(null).required(),
  });
}
