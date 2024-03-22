import moment from 'moment';
import { FormikErrors } from 'formik';

import { Button } from '@@/buttons';
import { Alert } from '@@/Alert';

import { EndpointChangeWindow } from '../../types';

import { TimeWindowPickerInputGroup } from './TimeWindowPickerInputGroup';
import { formatUTCTime, utcToTimeZone } from './utils';

type Props = {
  /**
   * The current start and end time values. in 'HH:mm' format (e.g. '00:00') and in UTC timezone.
   */
  values: EndpointChangeWindow;
  errors?: FormikErrors<EndpointChangeWindow>;
  initialValues: EndpointChangeWindow;
  onChangeTimeZone: (timeZone: string) => void;
  onChangeChangeWindow: (changeWindow: EndpointChangeWindow) => void;
  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;
  timeZone?: string;
  initialTimeZone?: string;
};

const summaryTimeFormat = 'h:mmA';

export function TimeWindowPicker({
  values,
  errors,
  initialValues,
  onChangeTimeZone,
  onChangeChangeWindow,
  isEditMode,
  setIsEditMode,
  timeZone = moment.tz.guess(),
  initialTimeZone,
}: Props) {
  return (
    <div className="mb-4 flex flex-col gap-y-2">
      {isEditMode && (
        <TimeWindowPickerInputGroup
          values={values}
          onChangeTimeZone={onChangeTimeZone}
          onChangeChangeWindow={onChangeChangeWindow}
          timeZone={timeZone}
          errors={errors}
        />
      )}
      <Alert color="info" className="[&>div]:!text-xs">
        <span>
          GitOps updates to stacks or applications outside{' '}
          <span className="font-bold">{`${formatUTCTime(
            values.StartTime,
            summaryTimeFormat
          )} - ${formatUTCTime(
            values.EndTime,
            summaryTimeFormat
          )} UTC (${utcToTimeZone(
            values.StartTime,
            timeZone,
            summaryTimeFormat
          )} - ${utcToTimeZone(values.EndTime, timeZone, summaryTimeFormat)} ${
            moment().isDST() ? ' DST' : ''
          } ${timeZone})`}</span>{' '}
          will not occur.
        </span>
      </Alert>
      {values.Enabled && (
        <div className="flex w-full">
          {!isEditMode && (
            <Button
              color="default"
              data-cy="edit-change-window-button"
              className="!ml-0"
              onClick={() => setIsEditMode(true)}
            >
              Edit Change Window
            </Button>
          )}
          {isEditMode && (
            <Button
              color="default"
              data-cy="cancel-change-window-button"
              className="!ml-0"
              onClick={() => {
                setIsEditMode(false);
                onChangeChangeWindow(initialValues);
                onChangeTimeZone(initialTimeZone || moment.tz.guess());
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
