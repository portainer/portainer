import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { ResourceEventsDatatable } from '@/react/kubernetes/components/EventsDatatable/ResourceEventsDatatable';
import { withReactQuery } from '@/react-tools/withReactQuery';

export const clusterManagementModule = angular
  .module('portainer.kubernetes.react.components.clusterManagement', [])
  .component(
    'resourceEventsDatatable',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(ResourceEventsDatatable))),
      ['resourceId', 'storageKey', 'namespace', 'noWidget', 'isLoading']
    )
  ).name;
