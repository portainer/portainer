import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { AuthenticationLogsTable } from '@/react/portainer/logs/AuthenticationLogsView/AuthenticationLogsTable';

export const activityLogsModule = angular
  .module('portainer.app.react.components.activity-logs', [])
  .component(
    'authenticationLogsTable',
    r2a(withUIRouter(withReactQuery(AuthenticationLogsTable)), [
      'currentPage',
      'dataset',
      'keyword',
      'limit',
      'totalItems',
      'sort',
      'onChangeSort',
      'onChangePage',
      'onChangeLimit',
      'onChangeKeyword',
    ])
  ).name;
