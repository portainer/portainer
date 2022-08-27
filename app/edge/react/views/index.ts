import angular from 'angular';

import { EdgeDevicesView } from '@/edge/EdgeDevices/EdgeDevicesView';
import { withCurrentUser } from '@/portainer/hooks/useUser';
import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';

export const viewsModule = angular
  .module('portainer.edge.react.views', [])
  .component(
    'edgeDevicesView',
    r2a(withReactQuery(withCurrentUser(EdgeDevicesView)), [])
  ).name;
