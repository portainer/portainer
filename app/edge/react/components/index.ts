import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { AssociatedEdgeEnvironmentsSelector } from '@/react/edge/components/AssociatedEdgeEnvironmentsSelector';
import { EdgeAsyncIntervalsForm } from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { EdgeScriptForm } from '@/react/edge/components/EdgeScriptForm';
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
    'edgeScriptForm',
    r2a(withReactQuery(EdgeScriptForm), [
      'edgeInfo',
      'commands',
      'asyncMode',
      'showMetaFields',
    ])
  )
  .component(
    'edgeCheckinIntervalField',
    r2a(withReactQuery(EdgeCheckinIntervalField), [
      'value',
      'onChange',
      'isDefaultHidden',
      'tooltip',
      'label',
      'readonly',
      'size',
    ])
  )
  .component(
    'edgeAsyncIntervalsForm',
    r2a(withReactQuery(EdgeAsyncIntervalsForm), [
      'values',
      'onChange',
      'isDefaultHidden',
      'readonly',
      'fieldSettings',
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
