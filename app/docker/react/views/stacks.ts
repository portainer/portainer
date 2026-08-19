import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ItemView } from '@/react/docker/stacks/ItemView/ItemView';
import { CreateView } from '@/react/docker/stacks/CreateView/CreateView';

export const stacksModule = angular
  .module('portainer.docker.stacks', [])
  .component(
    'stackItemView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ItemView))), [])
  )
  .component(
    'createStackView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(CreateView))), [])
  ).name;
