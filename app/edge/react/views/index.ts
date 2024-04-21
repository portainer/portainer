import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { WaitingRoomView } from '@/react/edge/edge-devices/WaitingRoomView';
import { ListView as EdgeGroupsListView } from '@/react/edge/edge-groups/ListView';

import { templatesModule } from './templates';
import { jobsModule } from './jobs';
import { stacksModule } from './edge-stacks';

export const viewsModule = angular
  .module('portainer.edge.react.views', [
    templatesModule,
    jobsModule,
    stacksModule,
  ])
  .component(
    'waitingRoomView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(WaitingRoomView))), [])
  )
  .component(
    'edgeGroupsView',
    r2a(withUIRouter(withCurrentUser(EdgeGroupsListView)), [])
  ).name;
