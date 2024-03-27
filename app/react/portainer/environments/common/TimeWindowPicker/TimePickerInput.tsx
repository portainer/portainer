import { ChevronUp, ChevronDown } from 'lucide-react';
import moment from 'moment';

import { Button } from '@@/buttons';
import { Input } from '@@/form-components/Input';

import { utcToTimeZone } from './utils';

const valueFormat = 'HH:mm';
const displayFormat = 'hh:mm';
const minuteIncrement = 5;

type Props = {
  utcTime: string;
  onChange: (time: string) => void;
  timeZone?: string;
};

export function TimePickerInput({
  utcTime,
  onChange,
  timeZone = 'UTC',
}: Props) {
  const localTime12h = utcToTimeZone(utcTime, timeZone, displayFormat);
  const localTime24h = utcToTimeZone(utcTime, timeZone, valueFormat);
  const [hours, minutes] = localTime12h.split(':');

  return (
    <div className="flex items-center">
      <div className="flex flex-col">
        <Button
          color="link"
          data-cy="env-time-picker-hours-up-button"
          size="medium"
          className="!ml-0 w-full"
          icon={ChevronUp}
          onClick={() => {
            const newTime = moment(localTime24h, valueFormat)
              .add(1, 'hours')
              .format(valueFormat);
            onChange(newTime);
          }}
        />
        <Input
          type="text"
          data-cy="time-picker-hours-input"
          value={hours}
          className="w-12 !cursor-default text-center"
          disabled
        />
        <Button
          color="link"
          data-cy="env-time-picker-hours-down-button"
          size="medium"
          className="!ml-0 w-full"
          icon={ChevronDown}
          onClick={() => {
            const newTime = moment(localTime24h, valueFormat)
              .subtract(1, 'hours')
              .format(valueFormat);
            onChange(newTime);
          }}
        />
      </div>
      :
      <div className="flex flex-col">
        <Button
          color="link"
          data-cy="env-time-picker-minutes-up-button"
          size="medium"
          className="!ml-0 w-full"
          icon={ChevronUp}
          onClick={() => {
            const newTime = moment(localTime24h, valueFormat)
              .add(minuteIncrement, 'minutes')
              .format(valueFormat);
            onChange(newTime);
          }}
        />
        <Input
          type="text"
          data-cy="time-picker-minutes-input"
          value={minutes}
          className="w-12 !cursor-default text-center"
          disabled
        />
        <Button
          color="link"
          data-cy="env-time-picker-minutes-down-button"
          size="medium"
          className="!ml-0 w-full"
          icon={ChevronDown}
          onClick={() => {
            const newTime = moment(localTime24h, valueFormat)
              .subtract(minuteIncrement, 'minutes')
              .format(valueFormat);
            onChange(newTime);
          }}
        />
      </div>
      <Button
        color="default"
        data-cy="env-time-picker-ampm-button"
        className="h-[34px]"
        onClick={() => {
          const newTime = moment(localTime24h, valueFormat)
            .add(12, 'hours')
            .format(valueFormat);
          onChange(newTime);
        }}
      >
        {moment(localTime24h, valueFormat).format('A')}
      </Button>
    </div>
  );
}
