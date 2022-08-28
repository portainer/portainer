import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { CreateView } from '@/react/azure/container-instances/CreateView';
import { ItemView } from '@/react/azure/container-instances/ItemView';
import { ListView } from '@/react/azure/container-instances/ListView';
import { DashboardView } from '@/react/azure/DashboardView';
import { withCurrentUser } from '@/portainer/hooks/useUser';

export const viewsModule = angular
  .module('portainer.azure.react.views', [])
  .component('containerInstanceView', r2a(withCurrentUser(ItemView), []))
  .component(
    'createContainerInstanceView',
    r2a(withCurrentUser(CreateView), [])
  )
  .component('containerInstancesView', r2a(withCurrentUser(ListView), []))
  .component('dashboardView', r2a(withCurrentUser(DashboardView), [])).name;
