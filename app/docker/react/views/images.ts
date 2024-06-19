import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ListView } from '@/react/docker/images/ListView/ListView';

export const imagesModule = angular
  .module('portainer.docker.react.views.images', [])
  .component(
    'imagesListView',
    r2a(withUIRouter(withCurrentUser(ListView)), [])
  ).name;
