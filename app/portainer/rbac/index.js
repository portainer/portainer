import { AccessHeaders } from '../authorization-guard';
import { rolesView } from './views/roles';
import { accessViewer } from './components/access-viewer';

import { RoleService } from './services/role.service';
import { RolesFactory } from './services/role.rest';

angular
  .module('portainer.rbac', ['ngResource'])
  .constant('API_ENDPOINT_ROLES', 'api/roles')
  .component('accessViewer', accessViewer)
  .component('rolesView', rolesView)
  .factory('RoleService', RoleService)
  .factory('Roles', RolesFactory)
  .config(config);

/* @ngInject */
function config($stateRegistryProvider) {
  const roles = {
    name: 'portainer.roles',
    url: '/roles',
    views: {
      'content@': {
        component: 'rolesView',
      },
    },
    data: {
      docs: '/admin/user/roles',
      access: AccessHeaders.Admin,
    },
  };

  $stateRegistryProvider.register(roles);
}
