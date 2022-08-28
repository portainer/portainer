import angular from 'angular';

import { EdgeDevicesView } from '@/edge/EdgeDevices/EdgeDevicesView';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';

export const viewsModule = angular
  .module('portainer.edge.react.views', [])
  .component(
    'edgeDevicesView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(EdgeDevicesView))), [])
  ).name;
