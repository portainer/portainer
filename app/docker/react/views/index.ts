import angular from 'angular';

import { ItemView as NetworksItemView } from '@/react/docker/networks/ItemView';
import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/portainer/hooks/useUser';
import { withReactQuery } from '@/react-tools/withReactQuery';

import { containersModule } from './containers';

export const viewsModule = angular
  .module('portainer.docker.react.views', [containersModule])

  .component(
    'networkDetailsView',
    r2a(withReactQuery(withCurrentUser(NetworksItemView)), [])
  ).name;
