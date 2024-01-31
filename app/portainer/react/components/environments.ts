import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { KVMControl } from '@/react/portainer/environments/KvmView/KVMControl';
import { TagsDatatable } from '@/react/portainer/environments/TagsView/TagsDatatable';

export const environmentsModule = angular
  .module('portainer.app.react.components.environments', [])
  .component('tagsDatatable', r2a(TagsDatatable, ['dataset', 'onRemove']))
  .component(
    'kvmControl',
    r2a(KVMControl, ['deviceId', 'server', 'token'])
  ).name;
