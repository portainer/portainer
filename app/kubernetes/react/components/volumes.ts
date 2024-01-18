import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { VolumesDatatable } from '@/react/kubernetes/volumes/ListView/VolumesDatatable';
import { StorageDatatable } from '@/react/kubernetes/volumes/ListView/StorageDatatable';

export const volumesModule = angular
  .module('portainer.kubernetes.react.components.volumes', [])
  .component(
    'kubernetesVolumesDatatable',
    r2a(withUIRouter(withCurrentUser(VolumesDatatable)), [
      'dataset',
      'onRemove',
      'onRefresh',
    ])
  )
  .component(
    'kubernetesVolumesStoragesDatatable',
    r2a(withUIRouter(withCurrentUser(StorageDatatable)), [
      'dataset',
      'onRefresh',
    ])
  ).name;
