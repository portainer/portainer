import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ListView } from '@/react/docker/networks/ListView/ListView';

export const networksModule = angular
  .module('portainer.docker.react.views.networks', [])
  .component(
    'networksListView',
    r2a(withUIRouter(withCurrentUser(ListView)), [])
  ).name;
