import angular from 'angular';
import { StateRegistry, StateService, StateParams } from '@uirouter/angularjs';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ContainerListView } from '@/react/docker/containers/ContainerListView';

export const namespacesModule = angular.module('portainer.app.react.views.namespaces', [])
  .component('containerListView', 
      r2a(withUIRouter(withReactQuery(withCurrentUser(ContainerListView))),['namespace'])
  )
  .config(config).name;

function config($stateRegistryProvider: StateRegistry) {
  $stateRegistryProvider.register({
    name: 'portainer.namespaces.containers',
    url: '/containers',
    views: {
      'content@': {
        component: 'containerListView',
      },
    },
    params: { namespace: ''},
    onEnter: /* @ngInject */ function onEnter(
      $async: (fn: () => Promise<void>) => Promise<void>, $state: StateService, $stateParams: StateParams
    ){
      eval('debugger')
   
      // console.log('11111')
      return async ()=>{
        
      }

    },
    resolve: {
      namespace: /* @ngInject */ function namespace($transition$,$stateParams) { 
        const {namespace} =  $stateParams
        return namespace
      }
    }
  });

}
