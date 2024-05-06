import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { CreateView } from '@/react/edge/edge-stacks/CreateView/CreateView';

export const stacksModule = angular
  .module('portainer.edge.react.views.stacks', [])
  .component(
    'edgeStacksCreateView',
    r2a(withCurrentUser(withUIRouter(CreateView)), [])
  ).name;
