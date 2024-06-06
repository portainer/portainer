import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ListView } from '@/react/edge/edge-groups/ListView';
import { CreateView } from '@/react/edge/edge-groups/CreateView/CreateView';
import { ItemView } from '@/react/edge/edge-groups/ItemView/ItemView';

export const groupsModule = angular
  .module('portainer.edge.react.views.groups', [])
  .component('edgeGroupsView', r2a(withUIRouter(withCurrentUser(ListView)), []))
  .component(
    'edgeGroupsCreateView',
    r2a(withUIRouter(withCurrentUser(CreateView)), [])
  )
  .component(
    'edgeGroupsItemView',
    r2a(withUIRouter(withCurrentUser(ItemView)), [])
  ).name;
