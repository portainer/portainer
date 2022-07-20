import angular from 'angular';

import { AngularSidebarService } from '@/react/sidebar/useSidebarState';
import { Sidebar } from '@/react/sidebar/Sidebar';
import { r2a } from '@/react-tools/react2angular';

export const sidebarModule = angular
  .module('portainer.app.sidebar', [])
  .component('sidebar', r2a(Sidebar, []))
  .factory('SidebarService', AngularSidebarService).name;
