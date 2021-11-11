import clsx from 'clsx';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

interface Props {
  checkInInterval?: number;
  edgeId?: string;
  homepageLoadTime?: number;
  lastCheckInDate?: number;
}

export function EdgeIndicator({
  edgeId,
  lastCheckInDate,
  checkInInterval,
  homepageLoadTime,
}: Props) {
  if (!edgeId) {
    return (
      <span className="label label-default">
        <s>associated</s>
      </span>
    );
  }

  // give checkIn some wiggle room
  let isCheckInValid = false;
  if (homepageLoadTime && lastCheckInDate && checkInInterval) {
    isCheckInValid =
      homepageLoadTime - lastCheckInDate <= checkInInterval * 2 + 20;
  }

  return (
    <span>
      <span
        className={clsx('label', {
          'label-danger': !isCheckInValid,
          'label-success': isCheckInValid,
        })}
      >
        heartbeat
      </span>

      {!!lastCheckInDate && (
        <span className="space-left small text-muted">
          {isoDateFromTimestamp(lastCheckInDate)}
        </span>
      )}
    </span>
  );
}
