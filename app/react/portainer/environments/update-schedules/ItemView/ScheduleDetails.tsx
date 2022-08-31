import _ from 'lodash';

import { NavTabs } from '@@/NavTabs';

import { EdgeUpdateSchedule, ScheduleType } from '../types';
import { ScheduledTimeField } from '../common/ScheduledTimeField';

export function ScheduleDetails({
  schedule,
}: {
  schedule: EdgeUpdateSchedule;
}) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <NavTabs
          options={[
            {
              id: ScheduleType.Update,
              label: 'Update',
              children: <UpdateDetails schedule={schedule} />,
            },
            {
              id: ScheduleType.Rollback,
              label: 'Rollback',
              children: <UpdateDetails schedule={schedule} />,
            },
          ]}
          selectedId={schedule.type}
          onSelect={() => {}}
          disabled
        />
      </div>
    </div>
  );
}

function UpdateDetails({ schedule }: { schedule: EdgeUpdateSchedule }) {
  const schedulesCount = Object.values(
    _.groupBy(
      schedule.status,
      (status) => `${status.currentVersion}-${status.targetVersion}`
    )
  ).map((statuses) => ({
    count: statuses.length,
    currentVersion: statuses[0].currentVersion,
    targetVersion: statuses[0].targetVersion,
  }));

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          {schedulesCount.map(({ count, currentVersion, targetVersion }) => (
            <div key={`${currentVersion}-${targetVersion}`}>
              {count} edge device(s) selected for{' '}
              {schedule.type === ScheduleType.Rollback ? 'rollback' : 'update'}{' '}
              from v{currentVersion} to v{targetVersion}
            </div>
          ))}
        </div>
      </div>

      <ScheduledTimeField disabled />
    </>
  );
}
