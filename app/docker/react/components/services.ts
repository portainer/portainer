import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { ServicesDatatable } from '@/react/docker/services/ListView/ServicesDatatable';
import { TasksDatatable } from '@/react/docker/services/ItemView/TasksDatatable';
import { PortsMappingField } from '@/react/docker/services/common/PortMappingField';

export const servicesModule = angular
  .module('portainer.docker.react.components.services', [])
  .component(
    'dockerServiceTasksDatatable',
    r2a(withUIRouter(withCurrentUser(TasksDatatable)), [
      'serviceName',
      'dataset',
      'isSlotColumnVisible',
    ])
  )
  .component(
    'dockerServicesDatatable',
    r2a(withUIRouter(withCurrentUser(ServicesDatatable)), [
      'dataset',
      'isAddActionVisible',
      'isStackColumnVisible',
      'onRefresh',
      'titleIcon',
    ])
  )
  .component(
    'dockerServicePortsMappingField',
    r2a(PortsMappingField, [
      'disabled',
      'value',
      'onChange',
      'readOnly',
      'errors',
    ])
  ).name;
