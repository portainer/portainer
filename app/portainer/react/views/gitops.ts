import angular from 'angular';

import { WorkflowsView } from '@/react/portainer/gitops/WorkflowsView/WorkflowsView';
import { ListView as SourcesListView } from '@/react/portainer/gitops/sources/ListView/ListView';
import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';

export const gitopsViewsModule = angular
  .module('portainer.app.react.views.gitops', [])

  .component(
    'workflowsView',
    r2a(withUIRouter(withCurrentUser(WorkflowsView)), [])
  )
  .component(
    'sourcesListView',
    r2a(withUIRouter(withCurrentUser(SourcesListView)), [])
  ).name;
