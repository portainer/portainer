import angular from 'angular';

import { EdgeGroupsSelector } from '@/react/edge/edge-stacks/components/EdgeGroupsSelector';
import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { EdgeScriptForm } from '@/react/edge/components/EdgeScriptForm';
import { EdgeAsyncIntervalsForm } from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { EdgeGroupAssociationTable } from '@/react/edge/components/EdgeGroupAssociationTable';
import { AssociatedEdgeEnvironmentsSelector } from '@/react/edge/components/AssociatedEdgeEnvironmentsSelector';

import { edgeJobsModule } from './edge-jobs';

const ngModule = angular
  .module('portainer.edge.react.components', [edgeJobsModule])

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
    'edgeGroupAssociationTable',
    r2a(withReactQuery(EdgeGroupAssociationTable), [
      'emptyContentLabel',
      'onClickRow',
      'query',
      'title',
      'data-cy',
    ])
  )
  .component(
    'associatedEdgeEnvironmentsSelector',
    r2a(withReactQuery(AssociatedEdgeEnvironmentsSelector), [
      'onChange',
      'value',
    ])
  );

export const componentsModule = ngModule.name;
