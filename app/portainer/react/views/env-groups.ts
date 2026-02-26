import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ListView } from '@/react/portainer/environments/environment-groups/ListView';
import { EditGroupView } from '@/react/portainer/environments/environment-groups/ItemView/EditGroupView';
import { CreateGroupView } from '@/react/portainer/environments/environment-groups/CreateView/CreateGroupView';

export const environmentGroupModule = angular
  .module('portainer.app.react.views.environment-groups', [])
  .component(
    'environmentGroupsListView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ListView))), [])
  )
  .component(
    'environmentGroupEditView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(EditGroupView))), [])
  )
  .component(
    'environmentGroupCreateView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(CreateGroupView))), [])
  ).name;
