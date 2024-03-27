import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { RepositoriesDatatable } from '@/react/portainer/registries/repositories/ListView/RepositoriesDatatable';

export const registriesModule = angular
  .module('portainer.app.react.components.registries', [])
  .component(
    'registryRepositoriesDatatable',
    r2a(withUIRouter(withReactQuery(RepositoriesDatatable)), ['dataset'])
  ).name;
