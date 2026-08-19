import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ListView } from '@/react/docker/configs/ListView/ListView';

export const configsModule = angular
  .module('portainer.docker.react.views.configs', [])
  .component(
    'configsListView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ListView))), [])
  ).name;
