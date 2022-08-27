import angular from 'angular';

import { HomeView } from '@/portainer/home';
import { withCurrentUser } from '@/portainer/hooks/useUser';
import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';

import { wizardModule } from './wizard';
import { teamsModule } from './teams';
import { updateSchedulesModule } from './update-schedules';

export const viewsModule = angular
  .module('portainer.app.react.views', [
    wizardModule,
    teamsModule,
    updateSchedulesModule,
  ])
  .component(
    'homeView',
    r2a(withReactQuery(withCurrentUser(HomeView)), [])
  ).name;
