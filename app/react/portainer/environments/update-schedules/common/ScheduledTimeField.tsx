import DateTimePicker from 'react-datetime-picker';
import { Calendar, X } from 'lucide-react';
import { useMemo } from 'react';
import { string } from 'yup';
import { useField } from 'formik';

import {
  isoDate,
  parseIsoDate,
  TIME_FORMAT,
} from '@/portainer/filters/filters';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { TextTip } from '@@/Tip/TextTip';

import { FormValues } from './types';

interface Props {
  disabled?: boolean;
}

export function ScheduledTimeField({ disabled }: Props) {
  const [{ name, value }, { error }, { setValue }] =
    useField<FormValues['scheduledTime']>('scheduledTime');

  const dateValue = useMemo(() => parseIsoDate(value), [value]);

  if (!value) {
    return null;
  }

  return (
    <>
      <FormControl label="Schedule date & time" errors={error}>
        {!disabled ? (
          <DateTimePicker
            format="y-MM-dd HH:mm:ss"
            className="form-control [&>div]:border-0"
            onChange={(date) => {
              const dateToSave =
                date || new Date(Date.now() + 24 * 60 * 60 * 1000);
              setValue(isoDate(dateToSave.valueOf()));
            }}
            name={name}
            value={dateValue}
            calendarIcon={<Calendar className="lucide" />}
            clearIcon={<X className="lucide" />}
            disableClock
            minDate={new Date(Date.now() - 24 * 60 * 60 * 1000)}
          />
        ) : (
          <Input defaultValue={value} disabled />
        )}
      </FormControl>
      {!disabled && value && (
        <TextTip color="blue">
          If time zone is not set on edge agent then UTC+0 will be used.
        </TextTip>
      )}
    </>
  );
}

export function timeValidation() {
  return string()
    .required('Scheduled time is required')
    .test(
      'validFormat',
      `Scheduled time must be in the format ${TIME_FORMAT}`,
      (value) => isValidDate(parseIsoDate(value))
    )
    .test(
      'validDate',
      `Scheduled time must be bigger then ${isoDate(
        Date.now() - 24 * 60 * 60 * 1000
      )}`,
      (value) =>
        parseIsoDate(value).valueOf() > Date.now() - 24 * 60 * 60 * 1000
    );
}

export function defaultValue() {
  return isoDate(Date.now() + 24 * 60 * 60 * 1000);
}

function isValidDate(date: Date) {
  return date instanceof Date && !Number.isNaN(date.valueOf());
}
