import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withControlledInput } from '@/react-tools/withControlledInput';
import { EdgeKeyDisplay } from '@/react/portainer/environments/ItemView/EdgeKeyDisplay';
import { KVMControl } from '@/react/portainer/environments/KvmView/KVMControl';
import { GpusList } from '@/react/docker/host/SetupView/GpusList';

export const environmentsModule = angular
  .module('portainer.app.react.components.environments', [])
  .component('edgeKeyDisplay', r2a(EdgeKeyDisplay, ['edgeKey']))
  .component('kvmControl', r2a(KVMControl, ['deviceId', 'server', 'token']))
  .component(
    'gpusList',
    r2a(withControlledInput(GpusList), ['value', 'onChange'])
  ).name;
