import angular from 'angular';

import { ListView } from '@/react/portainer/users/ListView/ListView';
import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';

export const usersModule = angular
  .module('portainer.app.react.views.users', [])

  .component(
    'usersListView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ListView))), [])
  ).name;
