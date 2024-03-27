import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { RbacRolesDatatable } from '@/react/portainer/users/RolesView/RbacRolesDatatable';

export const usersModule = angular
  .module('portainer.app.react.components.users', [])
  .component('rbacRolesDatatable', r2a(RbacRolesDatatable, ['dataset'])).name;
