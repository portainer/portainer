import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { EdgeKeyDisplay } from '@/react/portainer/environments/ItemView/EdgeKeyDisplay';
import { KVMControl } from '@/react/portainer/environments/KvmView/KVMControl';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { EnvironmentsDatatable } from '@/react/portainer/environments/ListView/EnvironmentsDatatable';

export const environmentsModule = angular
  .module('portainer.app.react.components.environments', [])
  .component('edgeKeyDisplay', r2a(EdgeKeyDisplay, ['edgeKey']))
  .component('kvmControl', r2a(KVMControl, ['deviceId', 'server', 'token']))
  .component(
    'environmentsDatatable',
    r2a(withUIRouter(withReactQuery(EnvironmentsDatatable)), ['onRemove'])
  ).name;
