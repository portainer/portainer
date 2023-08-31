import moment from 'moment';
import { useMemo } from 'react';

import { Select } from '@@/form-components/ReactSelect';
import { Option } from '@@/form-components/PortainerSelect';

import { EndpointChangeWindow } from '../../types';

import { timeZoneToUtc, utcToTimeZone } from './utils';
import { TimePickerInput } from './TimePickerInput';

type Props = {
  /**
   * The current start and end time values. in 'HH:mm' format (e.g. '00:00') and in UTC timezone.
   */
  values: EndpointChangeWindow;
  onChange: ({
    changeWindow,
    timeZone,
  }: {
    changeWindow: EndpointChangeWindow;
    timeZone: string;
  }) => void;
  timeZone?: string;
};

export function TimeWindowPickerInputGroup({
  values,
  onChange,
  timeZone = moment.tz.guess(),
}: Props) {
  // all unique timezones for all countries as options
  const timeZoneOptions = useMemo(() => {
    const countries = moment.tz.countries();
    const zones = countries.flatMap((country) =>
      moment.tz.zonesForCountry(country)
    );
    return [...new Set(zones)]
      .sort()
      .concat('UTC')
      .map((zone) => ({
        label: zone,
        value: zone,
      }));
  }, []);

  // set the initial timezone to the user's timezone if it is not set
  if (!timeZone) {
    const newTimeZone = moment.tz.guess();
    onChange({
      changeWindow: {
        ...values,
        StartTime: timeZoneToUtc(values.StartTime, newTimeZone),
        EndTime: timeZoneToUtc(values.EndTime, newTimeZone),
      },
      timeZone: newTimeZone,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5">
      <div className="flex items-center gap-x-5">
        <TimePickerInput
          utcTime={values.StartTime}
          timeZone={timeZone}
          onChange={(time) =>
            onChange({
              changeWindow: {
                ...values,
                StartTime: timeZoneToUtc(time, timeZone),
              },
              timeZone,
            })
          }
        />
        to
        <TimePickerInput
          utcTime={values.EndTime}
          timeZone={timeZone}
          onChange={(time) =>
            onChange({
              changeWindow: {
                ...values,
                EndTime: timeZoneToUtc(time, timeZone),
              },
              timeZone,
            })
          }
        />
      </div>
      <Select<Option<string>>
        options={timeZoneOptions}
        value={{ value: timeZone, label: timeZone }}
        className="w-72 min-w-fit"
        onChange={(newTimeZone) => {
          if (!newTimeZone) return;
          // update the utc time so that the local time displayed remains the same
          const updatedStartTime = onTimezoneChangeUpdateUTCTime(
            values.StartTime,
            timeZone,
            newTimeZone.value
          );
          const updatedEndTime = onTimezoneChangeUpdateUTCTime(
            values.EndTime,
            timeZone,
            newTimeZone.value
          );
          onChange({
            changeWindow: {
              ...values,
              StartTime: updatedStartTime,
              EndTime: updatedEndTime,
            },
            timeZone: newTimeZone.value,
          });
        }}
      />
    </div>
  );
}

function onTimezoneChangeUpdateUTCTime(
  utcTime: string,
  oldTimeZone: string,
  newTimeZone: string
) {
  const localTime = utcToTimeZone(utcTime, oldTimeZone);
  const newUtcTime = timeZoneToUtc(localTime, newTimeZone);
  return newUtcTime;
}
