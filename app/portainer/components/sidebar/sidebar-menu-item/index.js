import './sidebar-menu-item.css';

export const sidebarMenuItem = {
  templateUrl: './sidebar-menu-item.html',
  bindings: {
    path: '@',
    pathParams: '<',
    iconClass: '@',
    className: '@',
  },
  transclude: true,
};
