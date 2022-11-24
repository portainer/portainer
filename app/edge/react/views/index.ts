import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { ListView } from '@/react/edge/edge-devices/ListView';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { WaitingRoomView } from '@/react/edge/edge-devices/WaitingRoomView';

export const viewsModule = angular
  .module('portainer.edge.react.views', [])
  .component(
    'waitingRoomView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(WaitingRoomView))), [])
  )
  .component(
    'edgeDevicesView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ListView))), [])
  ).name;
