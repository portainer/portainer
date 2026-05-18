import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { EffectiveAccessViewerDatatable } from '@/react/portainer/users/RolesView/AccessViewer/EffectiveAccessViewerDatatable';
import { EffectiveAccessViewer } from '@/react/portainer/users/RolesView/AccessViewer/EffectiveAccessViewer';
import { RbacRolesDatatable } from '@/react/portainer/users/RolesView/RbacRolesDatatable';

export const usersModule = angular
  .module('portainer.app.react.components.users', [])
  .component(
    'effectiveAccessViewerDatatable',
    r2a(withUIRouter(withCurrentUser(EffectiveAccessViewerDatatable)), [
      'dataset',
    ])
  )
  .component(
    'effectiveAccessViewer',
    r2a(withUIRouter(withReactQuery(withCurrentUser(EffectiveAccessViewer))), [
      'userId',
    ])
  )
  .component('rbacRolesDatatable', r2a(RbacRolesDatatable, ['dataset'])).name;
