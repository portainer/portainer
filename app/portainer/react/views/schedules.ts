import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { BackupSchedulesListView } from '@/react/portainer/backup-schedules/ListView';
import { BackupScheduleItemView } from '@/react/portainer/backup-schedules/ItemView';
import { ReplicationSchedulesListView } from '@/react/portainer/replication-schedules/ListView';
import { ReplicationScheduleItemView } from '@/react/portainer/replication-schedules/ItemView';

export const backupSchedulesModule = angular
  .module('portainer.app.react.views.backup-schedules', [])
  .component(
    'backupSchedulesListView',
    r2a(withUIRouter(withCurrentUser(BackupSchedulesListView)), [])
  )
  .component(
    'backupScheduleItemView',
    r2a(withUIRouter(withCurrentUser(BackupScheduleItemView)), [])
  )
  .component(
    'replicationSchedulesListView',
    r2a(withUIRouter(withCurrentUser(ReplicationSchedulesListView)), [])
  )
  .component(
    'replicationScheduleItemView',
    r2a(withUIRouter(withCurrentUser(ReplicationScheduleItemView)), [])
  ).name;
