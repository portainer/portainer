import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { NodeApplicationsDatatable } from '@/react/kubernetes/cluster/NodeView/NodeApplicationsDatatable/NodeApplicationsDatatable';

export const clusterManagementModule = angular
  .module('portainer.kubernetes.react.components.clusterManagement', [])
  .component(
    'kubernetesNodeApplicationsDatatable',
    r2a(withUIRouter(withCurrentUser(NodeApplicationsDatatable)), [
      'dataset',
      'isLoading',
      'onRefresh',
    ])
  ).name;
