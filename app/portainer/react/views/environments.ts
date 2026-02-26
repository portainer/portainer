import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ListView } from '@/react/portainer/environments/ListView';
import { EdgeAutoCreateScriptViewWrapper } from '@/react/portainer/environments/EdgeAutoCreateScriptView/EdgeAutoCreateScriptView';
import { ItemView } from '@/react/portainer/environments/ItemView/ItemView';

export const environmentsModule = angular
  .module('portainer.app.react.views.environments', [])
  .component(
    'environmentsListView',
    r2a(withUIRouter(withCurrentUser(ListView)), [])
  )
  .component(
    'environmentsItemView',
    r2a(withUIRouter(withCurrentUser(ItemView)), [])
  )
  .component(
    'edgeAutoCreateScriptView',
    r2a(withUIRouter(withCurrentUser(EdgeAutoCreateScriptViewWrapper)), [])
  ).name;
