import './sidebar-menu.css';

import controller from './sidebar-menu.controller.js';

export const sidebarMenu = {
  templateUrl: './sidebar-menu.html',
  controller,
  bindings: {
    iconClass: '@',
    path: '@', // string
    pathParams: '<', //object, corresponds to https://ui-router.github.io/ng1/docs/latest/modules/directives.html#uistatedirective
    childrenPaths: '<', // []string (globs)
    label: '@', // string
    isSidebarOpen: '<',
    currentState: '@',
  },
  transclude: true,
};
