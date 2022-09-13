import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { CreateAccessToken } from '@/react/portainer/account/CreateAccessTokenView';
import {
  DefaultRegistryAction,
  DefaultRegistryDomain,
  DefaultRegistryName,
} from '@/react/portainer/registries/ListView/DefaultRegistry';

import { wizardModule } from './wizard';
import { teamsModule } from './teams';
import { updateSchedulesModule } from './update-schedules';

export const viewsModule = angular
  .module('portainer.app.react.views', [
    wizardModule,
    teamsModule,
    updateSchedulesModule,
  ])
  .component('defaultRegistryName', r2a(DefaultRegistryName, []))
  .component('defaultRegistryAction', r2a(DefaultRegistryAction, []))
  .component('defaultRegistryDomain', r2a(DefaultRegistryDomain, []))
  .component(
    'createAccessToken',
    r2a(CreateAccessToken, ['onSubmit', 'onError'])
  ).name;
