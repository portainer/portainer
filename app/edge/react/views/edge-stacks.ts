import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { CreateView } from '@/react/edge/edge-stacks/CreateView/CreateView';
import { ItemView } from '@/react/edge/edge-stacks/ItemView/ItemView';
import { ListView } from '@/react/edge/edge-stacks/ListView';

export const stacksModule = angular
  .module('portainer.edge.react.views.stacks', [])
  .component(
    'edgeStacksCreateView',
    r2a(withCurrentUser(withUIRouter(CreateView)), [])
  )
  .component(
    'edgeStacksItemView',
    r2a(withCurrentUser(withUIRouter(ItemView)), [])
  )
  .component(
    'edgeStacksView',
    r2a(withUIRouter(withCurrentUser(ListView)), [])
  ).name;
