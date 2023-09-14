import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { VolumesDatatable } from '@/react/docker/volumes/ListView/VolumesDatatable';
import { withCurrentUser } from '@/react-tools/withCurrentUser';

export const volumesModule = angular
  .module('portainer.docker.react.components.volumes', [])
  .component(
    'volumesDatatable',
    r2a(withUIRouter(withCurrentUser(VolumesDatatable)), [
      'dataset',
      'onRemove',
      'onRefresh',
      'isBrowseVisible',
    ])
  ).name;
