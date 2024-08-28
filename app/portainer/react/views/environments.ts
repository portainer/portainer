import angular from 'angular';

import { ListView } from '@/react/portainer/environments/ListView';
import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ItemView } from '@/react/portainer/environments/ItemView/ItemView';

export const environmentsModule = angular
  .module('portainer.app.environments', [])
  .component(
    'environmentsItemView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ItemView))), [])
  )
  .component(
    'environmentsListView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ListView))), [])
  ).name;
