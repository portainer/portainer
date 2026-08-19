import angular from 'angular';

import { AngularSidebarService } from '@/react/sidebar/useSidebarState';
import { Sidebar } from '@/react/sidebar/Sidebar';
import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';

export const sidebarModule = angular
  .module('portainer.app.sidebar', [])
  .component(
    'sidebar',
    r2a(withUIRouter(withReactQuery(withCurrentUser(Sidebar))), [])
  )
  .factory('SidebarService', AngularSidebarService).name;
