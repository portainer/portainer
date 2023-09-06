import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { TasksDatatable } from '@/react/docker/services/ListView/ServicesDatatable/TasksDatatable';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { TaskTableQuickActions } from '@/react/docker/services/common/TaskTableQuickActions';

export const servicesModule = angular
  .module('portainer.docker.react.components.services', [])
  .component(
    'dockerServiceTasksDatatable',
    r2a(withUIRouter(withCurrentUser(TasksDatatable)), ['dataset', 'search'])
  )
  .component(
    'dockerTaskTableQuickActions',
    r2a(withUIRouter(withCurrentUser(TaskTableQuickActions)), [
      'state',
      'taskId',
    ])
  ).name;
