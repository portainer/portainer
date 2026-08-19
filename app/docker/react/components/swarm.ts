import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { NodesDatatable } from '@/react/docker/swarm/SwarmView/NodesDatatable';

export const swarmModule = angular
  .module('portainer.docker.react.components.swarm', [])
  .component(
    'nodesDatatable',
    r2a(withUIRouter(NodesDatatable), [
      'dataset',
      'isIpColumnVisible',
      'haveAccessToNode',
      'onRefresh',
    ])
  ).name;
