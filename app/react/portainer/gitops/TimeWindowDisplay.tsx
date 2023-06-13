import moment from 'moment';
import 'moment-timezone';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';

import { TextTip } from '@@/Tip/TextTip';

import { withEdition } from '../feature-flags/withEdition';

const TimeWindowDisplayWrapper = withEdition(TimeWindowDisplay, 'BE');

export { TimeWindowDisplayWrapper as TimeWindowDisplay };

function TimeWindowDisplay() {
  const currentEnvQuery = useCurrentEnvironment(false);

  if (!currentEnvQuery.data) {
    return null;
  }

  const { ChangeWindow } = currentEnvQuery.data;

  if (!ChangeWindow.Enabled) {
    return null;
  }
  const timezone = moment.tz.guess();
  const isDST = moment().isDST();
  const { startTime: startTimeLocal, endTime: endTimeLocal } = utcToTime(
    { startTime: ChangeWindow.StartTime, endTime: ChangeWindow.EndTime },
    timezone
  );

  const { startTime: startTimeUtc, endTime: endTimeUtc } = parseInterval(
    ChangeWindow.StartTime,
    ChangeWindow.EndTime
  );

  return (
    <TextTip color="orange" className="mb-2">
      A change window is enabled, GitOps updates will not occur outside of{' '}
      <span className="font-bold">
        {shortTime(startTimeUtc)} - {shortTime(endTimeUtc)} UTC (
        {shortTime(startTimeLocal)} -{shortTime(endTimeLocal)}{' '}
        {isDST ? 'DST' : ''} {timezone})
      </span>
      .
    </TextTip>
  );
}

function utcToTime(
  utcTime: { startTime: string; endTime: string },
  timezone: string
) {
  const startTime = moment
    .tz(utcTime.startTime, 'HH:mm', 'GMT')
    .tz(timezone)
    .format('HH:mm');
  const endTime = moment
    .tz(utcTime.endTime, 'HH:mm', 'GMT')
    .tz(timezone)
    .format('HH:mm');

  return parseInterval(startTime, endTime);
}

function parseTime(originalTime: string) {
  const [startHour, startMin] = originalTime.split(':');

  const time = new Date();

  time.setHours(parseInt(startHour, 10));
  time.setMinutes(parseInt(startMin, 10));

  return time;
}

function parseInterval(startTime: string, endTime: string) {
  return {
    startTime: parseTime(startTime),
    endTime: parseTime(endTime),
  };
}

function shortTime(time: Date) {
  return moment(time).format('h:mm a');
}
