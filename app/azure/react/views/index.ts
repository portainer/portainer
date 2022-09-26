import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { CreateView } from '@/react/azure/container-instances/CreateView';
import { ItemView } from '@/react/azure/container-instances/ItemView';
import { ListView } from '@/react/azure/container-instances/ListView';
import { DashboardView } from '@/react/azure/DashboardView';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';

export const viewsModule = angular
  .module('portainer.azure.react.views', [])
  .component(
    'containerInstanceView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ItemView))), [])
  )
  .component(
    'createContainerInstanceView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(CreateView))), [])
  )
  .component(
    'containerInstancesView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ListView))), [])
  )
  .component(
    'dashboardView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(DashboardView))), [])
  ).name;
