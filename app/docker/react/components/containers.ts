import angular from 'angular';

import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { r2a } from '@/react-tools/react2angular';
import { ContainerNetworksDatatable } from '@/react/docker/containers/ItemView/ContainerNetworksDatatable';

const ngModule = angular
  .module('portainer.docker.react.components.containers', [])
  .component(
    'dockerContainerNetworksDatatable',
    r2a(withUIRouter(withCurrentUser(ContainerNetworksDatatable)), [
      'container',
      'dataset',
      'nodeName',
    ])
  );

export const containersModule = ngModule.name;
