import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { CreateView } from '@/react/azure/container-instances/CreateView';
import { ItemView } from '@/react/azure/container-instances/ItemView';
import { ListView } from '@/react/azure/container-instances/ListView';
import { DashboardView } from '@/react/azure/DashboardView';
import { withCurrentUser } from '@/portainer/hooks/useUser';
import { withReactQuery } from '@/react-tools/withReactQuery';

export const viewsModule = angular
  .module('portainer.azure.react.views', [])
  .component(
    'containerInstanceView',
    r2a(withReactQuery(withCurrentUser(ItemView)), [])
  )
  .component(
    'createContainerInstanceView',
    r2a(withReactQuery(withCurrentUser(CreateView)), [])
  )
  .component(
    'containerInstancesView',
    r2a(withReactQuery(withCurrentUser(ListView)), [])
  )
  .component(
    'dashboardView',
    r2a(withReactQuery(withCurrentUser(DashboardView)), [])
  ).name;
