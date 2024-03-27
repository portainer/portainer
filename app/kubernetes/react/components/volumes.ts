import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { StorageDatatable } from '@/react/kubernetes/volumes/ListView/StorageDatatable';

export const volumesModule = angular
  .module('portainer.kubernetes.react.components.volumes', [])
  .component(
    'kubernetesVolumesStoragesDatatable',
    r2a(withUIRouter(withCurrentUser(StorageDatatable)), [
      'dataset',
      'onRefresh',
    ])
  ).name;
