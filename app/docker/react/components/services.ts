import angular from 'angular';
import { SchemaOf } from 'yup';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { ServicesDatatable } from '@/react/docker/services/ListView/ServicesDatatable';
import { TasksDatatable } from '@/react/docker/services/ItemView/TasksDatatable';
import {
  PortsMappingField,
  portsMappingUtils,
  PortsMappingValues,
} from '@/react/docker/services/ItemView/PortMappingField';
import { withFormValidation } from '@/react-tools/withFormValidation';

const ngModule = angular
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
      'tableKey',
    ])
  );

export const servicesModule = ngModule.name;

withFormValidation(
  ngModule,
  withUIRouter(withCurrentUser(PortsMappingField)),
  'dockerServicePortsMappingField',
  ['disabled', 'readOnly', 'hasChanges', 'onReset', 'onSubmit'],
  portsMappingUtils.validation as unknown as () => SchemaOf<PortsMappingValues>
);
