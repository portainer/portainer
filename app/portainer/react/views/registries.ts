import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ListView } from '@/react/portainer/registries/ListView';
import { ListView as EnvironmentListView } from '@/react/portainer/registries/environments/ListView';

export const registriesModule = angular
  .module('portainer.app.react.views.registries', [])
  .component(
    'registriesView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ListView))), [])
  )
  .component(
    'environmentRegistriesView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(EnvironmentListView))), [])
  ).name;
