import angular from 'angular';
import { Gpu } from 'Docker/react/views/gpu';

import { ItemView as NetworksItemView } from '@/react/docker/networks/ItemView';
import { r2a } from '@/react-tools/react2angular';

import { containersModule } from './containers';

export const viewsModule = angular
  .module('portainer.docker.react.views', [containersModule])
  .component(
    'gpu',
    r2a(Gpu, ['values', 'onChange', 'gpus', 'usedGpus', 'usedAllGpus'])
  )
  .component('networkDetailsView', r2a(NetworksItemView, [])).name;
