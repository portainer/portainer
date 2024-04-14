import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { WaitingRoomView } from '@/react/edge/edge-devices/WaitingRoomView';
import { ListView as EdgeStacksListView } from '@/react/edge/edge-stacks/ListView';
import { ListView as EdgeGroupsListView } from '@/react/edge/edge-groups/ListView';

import { templatesModule } from './templates';
import { jobsModule } from './jobs';

export const viewsModule = angular
  .module('portainer.edge.react.views', [templatesModule, jobsModule])
  .component(
    'waitingRoomView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(WaitingRoomView))), [])
  )
  .component(
    'edgeStacksView',
    r2a(withUIRouter(withCurrentUser(EdgeStacksListView)), [])
  )
  .component(
    'edgeGroupsView',
    r2a(withUIRouter(withCurrentUser(EdgeGroupsListView)), [])
  ).name;
