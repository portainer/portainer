import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { UsersDatatable } from '@/react/portainer/users/ListView/UsersDatatable/UsersDatatable';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { EffectiveAccessViewerDatatable } from '@/react/portainer/users/RolesView/AccessViewer/EffectiveAccessViewerDatatable';

export const usersModule = angular
  .module('portainer.app.react.components.users', [])
  .component(
    'usersDatatable',
    r2a(withUIRouter(withCurrentUser(UsersDatatable)), ['dataset', 'onRemove'])
  )
  .component(
    'effectiveAccessViewerDatatable',
    r2a(withUIRouter(withCurrentUser(EffectiveAccessViewerDatatable)), [
      'dataset',
    ])
  ).name;
