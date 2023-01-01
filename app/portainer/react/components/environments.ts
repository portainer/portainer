import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { EdgeKeyDisplay } from '@/react/portainer/environments/ItemView/EdgeKeyDisplay';
import { KVMControl } from '@/react/portainer/environments/KvmView/KVMControl';

export const environmentsModule = angular
  .module('portainer.app.react.components.environments', [])
  .component('edgeKeyDisplay', r2a(EdgeKeyDisplay, ['edgeKey']))
  .component(
    'kvmControl',
    r2a(KVMControl, ['deviceId', 'server', 'token'])
  ).name;
