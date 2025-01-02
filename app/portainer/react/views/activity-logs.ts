import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ActivityLogsView } from '@/react/portainer/logs/ActivityLogsView/ActivityLogsView';
import { withCurrentUser } from '@/react-tools/withCurrentUser';

export const activityLogsModule = angular
  .module('portainer.app.react.views.activity-logs', [])
  .component(
    'activityLogsView',
    r2a(withUIRouter(withCurrentUser(ActivityLogsView)), [])
  ).name;
