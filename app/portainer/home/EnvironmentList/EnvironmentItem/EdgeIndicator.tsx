import clsx from 'clsx';

import { isoDateFromTimestamp } from '@/portainer/filters/filters';

interface Props {
  checkInInterval?: number;
  edgeId?: string;
  queryDate?: number;
  lastCheckInDate?: number;
}

export function EdgeIndicator({
  edgeId,
  lastCheckInDate,
  checkInInterval,
  queryDate,
}: Props) {
  if (!edgeId) {
    return (
      <span className="label label-default" aria-label="unassociated">
        <s>associated</s>
      </span>
    );
  }

  // give checkIn some wiggle room
  let isCheckValid = false;
  if (checkInInterval && queryDate && lastCheckInDate) {
    isCheckValid = queryDate - lastCheckInDate <= checkInInterval * 2 + 20;
  }

  return (
    <span>
      <span
        className={clsx('label', {
          'label-danger': !isCheckValid,
          'label-success': isCheckValid,
        })}
        aria-label="edge-heartbeat"
      >
        heartbeat
      </span>

      {!!lastCheckInDate && (
        <span
          className="space-left small text-muted"
          aria-label="edge-last-checkin"
        >
          {isoDateFromTimestamp(lastCheckInDate)}
        </span>
      )}
    </span>
  );
}
