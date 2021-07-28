import angular from 'angular';
import './sidebar.css';

import { sidebarMenu } from './sidebar-menu';
import { sidebarSection } from './sidebar-section';
import { sidebarMenuItem } from './sidebar-menu-item';

export default angular
  .module('portainer.app.components.sidebar', [])
  .component('sidebarMenu', sidebarMenu)
  .component('sidebarMenuItem', sidebarMenuItem)
  .component('sidebarSection', sidebarSection).name;
