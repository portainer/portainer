import moment from 'moment';
import { useMemo } from 'react';
import { FormikErrors } from 'formik';

import { Select } from '@@/form-components/ReactSelect';
import { Option } from '@@/form-components/PortainerSelect';
import { FormError } from '@@/form-components/FormError';

import { EndpointChangeWindow } from '../../types';

import { timeZoneToUtc, utcToTimeZone } from './utils';
import { TimePickerInput } from './TimePickerInput';

type Props = {
  /**
   * The current start and end time values. in 'HH:mm' format (e.g. '00:00') and in UTC timezone.
   */
  values: EndpointChangeWindow;
  errors?: FormikErrors<EndpointChangeWindow>;
  onChangeTimeZone: (timeZone: string) => void;
  onChangeChangeWindow: (changeWindow: EndpointChangeWindow) => void;
  timeZone?: string;
};

export function TimeWindowPickerInputGroup({
  values,
  errors,
  onChangeTimeZone,
  onChangeChangeWindow,
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
    onChangeChangeWindow({
      ...values,
      StartTime: timeZoneToUtc(values.StartTime, newTimeZone),
      EndTime: timeZoneToUtc(values.EndTime, newTimeZone),
    });
    onChangeTimeZone(newTimeZone);
  }

  // find the option index for react-select to scroll to the current option
  const timeZoneOptionIndex = useMemo(
    () => timeZoneOptions.findIndex((option) => option.value === timeZone),
    [timeZone, timeZoneOptions]
  );

  return (
    <div className="flex-col">
      <div className="flex flex-wrap items-center gap-x-5">
        <div className="inline-flex flex-wrap items-center gap-x-5">
          <TimePickerInput
            utcTime={values.StartTime}
            timeZone={timeZone}
            onChange={(time) =>
              onChangeChangeWindow({
                ...values,
                StartTime: timeZoneToUtc(time, timeZone),
              })
            }
          />
          to
          <TimePickerInput
            utcTime={values.EndTime}
            timeZone={timeZone}
            onChange={(time) =>
              onChangeChangeWindow({
                ...values,
                EndTime: timeZoneToUtc(time, timeZone),
              })
            }
          />
        </div>
        <Select<Option<string>>
          options={timeZoneOptions}
          value={timeZoneOptions[timeZoneOptionIndex]}
          className="min-w-fit max-w-xs flex-1 basis-[fit-content]"
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
            onChangeChangeWindow({
              ...values,
              StartTime: updatedStartTime,
              EndTime: updatedEndTime,
            });
            onChangeTimeZone(newTimeZone.value);
          }}
          data-cy="time-window-picker-timezone-select"
          id="time-window-picker-timezone-select"
        />
      </div>
      {errors?.StartTime && <FormError>{errors.StartTime}</FormError>}
      {errors?.EndTime && <FormError>{errors.EndTime}</FormError>}
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
