import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { AssociatedEdgeEnvironmentsSelector } from '@/react/edge/components/AssociatedEdgeEnvironmentsSelector';
import { EdgeGroupsSelector } from '@/react/edge/edge-stacks/components/EdgeGroupsSelector';

const ngModule = angular
  .module('portainer.edge.react.components', [])

  .component(
    'edgeGroupsSelector',
    r2a(withUIRouter(withReactQuery(EdgeGroupsSelector)), [
      'onChange',
      'value',
      'error',
      'horizontal',
      'isGroupVisible',
      'required',
    ])
  )

  .component(
    'associatedEdgeEnvironmentsSelector',
    r2a(withReactQuery(AssociatedEdgeEnvironmentsSelector), [
      'onChange',
      'value',
      'error',
    ])
  );

export const componentsModule = ngModule.name;
