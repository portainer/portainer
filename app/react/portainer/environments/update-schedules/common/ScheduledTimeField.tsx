import { useField } from 'formik';
import { useMemo } from 'react';
import { string } from 'yup';

import {
  isoDate,
  parseIsoDate,
  TIME_FORMAT,
} from '@/portainer/filters/filters';

import { DateTimeField, FORMAT } from '@@/DateTimeField';
import { TextTip } from '@@/Tip/TextTip';

import { FormValues } from './types';

interface Props {
  disabled?: boolean;
}

export function ScheduledTimeField({ disabled }: Props) {
  const [{ name, value }, { error }, { setValue }] =
    useField<FormValues['scheduledTime']>('scheduledTime');
  const dateValue = useMemo(() => parseIsoDate(value, FORMAT), [value]);

  if (!value) {
    return null;
  }

  return (
    <>
      <DateTimeField
        label="Schedule date & time"
        minDate={new Date(Date.now() - 24 * 60 * 60 * 1000)}
        onChange={(date) => {
          const dateToSave = date || new Date(Date.now() + 24 * 60 * 60 * 1000);
          setValue(isoDate(dateToSave.valueOf(), FORMAT));
        }}
        error={error}
        disabled={disabled}
        name={name}
        value={dateValue}
        data-cy="update-schedules-time-input"
      />
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
      `Scheduled time must be bigger then ${
        (isoDate(Date.now() - 24 * 60 * 60 * 1000), FORMAT)
      }`,
      (value) =>
        parseIsoDate(value).valueOf() > Date.now() - 24 * 60 * 60 * 1000
    );
}

export function defaultValue() {
  return isoDate(Date.now(), FORMAT);
}

function isValidDate(date: Date) {
  return date instanceof Date && !Number.isNaN(date.valueOf());
}
