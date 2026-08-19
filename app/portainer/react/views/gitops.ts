import angular from 'angular';

import { ListView as WorkflowsListView } from '@/react/portainer/gitops/workflows/ListView/ListView';
import { ItemView as WorkflowItemView } from '@/react/portainer/gitops/workflows/ItemView/ItemView';
import { ListView as SourcesListView } from '@/react/portainer/gitops/sources/ListView/ListView';
import { ItemView as SourceItemView } from '@/react/portainer/gitops/sources/ItemView/ItemView';
import { CreateView as SourceCreateView } from '@/react/portainer/gitops/sources/CreateView/CreateView';
import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';

export const gitopsViewsModule = angular
  .module('portainer.app.react.views.gitops', [])
  .component(
    'workflowsView',
    r2a(withUIRouter(withCurrentUser(WorkflowsListView)), [])
  )
  .component(
    'workflowItemView',
    r2a(withUIRouter(withCurrentUser(WorkflowItemView)), [])
  )
  .component(
    'sourcesListView',
    r2a(withUIRouter(withCurrentUser(SourcesListView)), [])
  )
  .component(
    'sourceItemView',
    r2a(withUIRouter(withCurrentUser(SourceItemView)), [])
  )
  .component(
    'sourceCreateView',
    r2a(withUIRouter(withCurrentUser(SourceCreateView)), [])
  ).name;
