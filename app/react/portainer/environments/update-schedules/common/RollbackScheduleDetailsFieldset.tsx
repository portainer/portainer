import { RollbackOptions } from './RollbackOptions';
import { ScheduledTimeField } from './ScheduledTimeField';

interface Props {
  hasTimeZone: boolean;
  hasGroupSelected: boolean;
}

export function RollbackScheduleDetailsFieldset({
  hasTimeZone,
  hasGroupSelected,
}: Props) {
  return (
    <div className="mt-3">
      <RollbackOptions />
      {hasTimeZone && hasGroupSelected && <ScheduledTimeField />}
    </div>
  );
}
