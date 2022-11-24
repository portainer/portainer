import _ from 'lodash';
import { Clock } from 'react-feather';

import { Environment } from '@/react/portainer/environments/types';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';
import { EdgeGroup } from '@/react/edge/edge-groups/types';

import { ActiveSchedule } from '../queries/useActiveSchedules';
import { ScheduleType } from '../types';

export function ActiveSchedulesNotice({
  selectedEdgeGroupIds,
  activeSchedules,
  environments,
}: {
  selectedEdgeGroupIds: EdgeGroup['Id'][];
  activeSchedules: ActiveSchedule[];
  environments: Environment[];
}) {
  const groupsQuery = useEdgeGroups();

  if (!groupsQuery.data) {
    return null;
  }

  // environmentId -> {currentVersion, targetVersion}
  const environmentScheduleGroup = Object.fromEntries(
    activeSchedules.map((schedule) => [
      schedule.environmentId,
      {
        currentVersion:
          environments.find((env) => env.Id === schedule.environmentId)?.Agent
            .Version || '',
        targetVersion: schedule.targetVersion,
        type: schedule.type,
      },
    ])
  );

  const edgeGroups = groupsQuery.data
    .filter((edgeGroup) => selectedEdgeGroupIds.includes(edgeGroup.Id))
    .map((edgeGroup) => ({
      edgeGroupId: edgeGroup.Id,
      edgeGroupName: edgeGroup.Name,
      schedules: Object.values(
        _.groupBy(
          _.compact(
            edgeGroup.Endpoints.map((eId) => environmentScheduleGroup[eId])
          ),
          (schedule) =>
            `${schedule.currentVersion}_${schedule.targetVersion}_${schedule.type}`
        )
      ).map((schedules) => ({
        currentVersion: schedules[0].currentVersion,
        targetVersion: schedules[0].targetVersion,
        scheduleCount: schedules.length,
        type: schedules[0].type,
      })),
    }))
    .filter((group) => group.schedules.length > 0);

  if (edgeGroups.length === 0) {
    return null;
  }

  return (
    <div className="form-group">
      <div className="col-sm-12 space-y-1">
        {edgeGroups.map(({ edgeGroupId, edgeGroupName, schedules }) =>
          schedules.map(
            ({ currentVersion, scheduleCount, targetVersion, type }) => (
              <ActiveSchedulesNoticeItem
                currentVersion={currentVersion || 'unknown version'}
                key={`${edgeGroupId}-${currentVersion}-${targetVersion}`}
                name={edgeGroupName}
                scheduleCount={scheduleCount}
                version={targetVersion}
                scheduleType={type}
              />
            )
          )
        )}
      </div>
    </div>
  );
}

function ActiveSchedulesNoticeItem({
  name,
  scheduleCount,
  version,
  currentVersion,
  scheduleType,
}: {
  name: string;
  scheduleCount: number;
  version: string;
  currentVersion: string;
  scheduleType: ScheduleType;
}) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <Clock className="feather" />
      {scheduleCount} edge devices in {name} are scheduled for{' '}
      {scheduleType === ScheduleType.Rollback ? 'rollback' : 'update'} from{' '}
      {currentVersion} to {version}
    </div>
  );
}
