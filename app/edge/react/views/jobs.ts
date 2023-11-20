import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ListView } from '@/react/edge/edge-jobs/ListView';

export const jobsModule = angular
  .module('portainer.edge.react.views.jobs', [])
  .component(
    'edgeJobsView',
    r2a(withUIRouter(withCurrentUser(ListView)), [])
  ).name;
