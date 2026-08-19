import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { WaitingRoomView } from '@/react/edge/edge-devices/WaitingRoomView';

import { templatesModule } from './templates';
import { jobsModule } from './jobs';
import { stacksModule } from './edge-stacks';
import { groupsModule } from './groups';

export const viewsModule = angular
  .module('portainer.edge.react.views', [
    templatesModule,
    jobsModule,
    stacksModule,
    groupsModule,
  ])
  .component(
    'waitingRoomView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(WaitingRoomView))), [])
  ).name;
