import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import {
  DefaultRegistryAction,
  DefaultRegistryDomain,
  DefaultRegistryName,
} from '@/react/portainer/registries/ListView/DefaultRegistry';
import { RepositoriesDatatable } from '@/react/portainer/registries/repositories/ListView/RepositoriesDatatable';
import { withUIRouter } from '@/react-tools/withUIRouter';

export const registriesModule = angular
  .module('portainer.app.react.components.registries', [])
  .component(
    'defaultRegistryName',
    r2a(withReactQuery(DefaultRegistryName), [])
  )
  .component(
    'defaultRegistryAction',
    r2a(withReactQuery(DefaultRegistryAction), [])
  )
  .component(
    'defaultRegistryDomain',
    r2a(withReactQuery(DefaultRegistryDomain), [])
  )
  .component(
    'registryRepositoriesDatatable',
    r2a(withUIRouter(withReactQuery(RepositoriesDatatable)), ['dataset'])
  ).name;
