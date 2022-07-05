import angular from 'angular';
import { Gpu } from 'Docker/react/views/gpu';

import { ItemView } from '@/react/docker/networks/ItemView';
import { r2a } from '@/react-tools/react2angular';

export const viewsModule = angular
  .module('portainer.docker.react.views', [])
  .component(
    'gpu',
    r2a(Gpu, ['values', 'onChange', 'gpus', 'usedGpus', 'usedAllGpus'])
  )
  .component('networkDetailsView', r2a(ItemView, [])).name;
