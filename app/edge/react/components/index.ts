import angular from 'angular';

import { EdgeGroupsSelector } from '@/react/edge/edge-stacks/components/EdgeGroupsSelector';
import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { EdgeScriptForm } from '@/react/edge/components/EdgeScriptForm';
import { EdgeAsyncIntervalsForm } from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { EdgeStackDeploymentTypeSelector } from '@/react/edge/edge-stacks/components/EdgeStackDeploymentTypeSelector';
import { EditEdgeStackForm } from '@/react/edge/edge-stacks/ItemView/EditEdgeStackForm/EditEdgeStackForm';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { EdgeGroupAssociationTable } from '@/react/edge/components/EdgeGroupAssociationTable';
import { AssociatedEdgeEnvironmentsSelector } from '@/react/edge/components/AssociatedEdgeEnvironmentsSelector';
import { EnvironmentsDatatable } from '@/react/edge/edge-stacks/ItemView/EnvironmentsDatatable';

export const componentsModule = angular
  .module('portainer.edge.react.components', [])
  .component(
    'edgeStackEnvironmentsDatatable',
    r2a(withUIRouter(withReactQuery(EnvironmentsDatatable)), [])
  )
  .component(
    'edgeGroupsSelector',
    r2a(withUIRouter(withReactQuery(EdgeGroupsSelector)), [
      'onChange',
      'value',
      'error',
      'horizontal',
      'isGroupVisible',
    ])
  )
  .component(
    'edgeScriptForm',
    r2a(withReactQuery(EdgeScriptForm), [
      'edgeInfo',
      'commands',
      'isNomadTokenVisible',
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
    'edgeStackDeploymentTypeSelector',
    r2a(withReactQuery(EdgeStackDeploymentTypeSelector), [
      'value',
      'onChange',
      'hasDockerEndpoint',
      'hasKubeEndpoint',
      'hasNomadEndpoint',
      'allowKubeToSelectCompose',
    ])
  )
  .component(
    'editEdgeStackForm',
    r2a(withUIRouter(withReactQuery(withCurrentUser(EditEdgeStackForm))), [
      'edgeStack',
      'fileContent',
      'isSubmitting',
      'onEditorChange',
      'onSubmit',
      'allowKubeToSelectCompose',
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
  ).name;
