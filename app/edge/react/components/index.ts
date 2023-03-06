import angular from 'angular';

import { EdgeGroupsSelector } from '@/react/edge/edge-stacks/components/EdgeGroupsSelector';
import { r2a } from '@/react-tools/react2angular';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { EdgeScriptForm } from '@/react/edge/components/EdgeScriptForm';
import { EdgeAsyncIntervalsForm } from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { EdgeStackDeploymentTypeSelector } from '@/react/edge/edge-stacks/components/EdgeStackDeploymentTypeSelector';

export const componentsModule = angular
  .module('portainer.edge.react.components', [])
  .component(
    'edgeGroupsSelector',
    r2a(EdgeGroupsSelector, ['items', 'onChange', 'value'])
  )
  .component(
    'edgeScriptForm',
    r2a(withReactQuery(EdgeScriptForm), [
      'edgeInfo',
      'commands',
      'isNomadTokenVisible',
      'asyncMode',
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
      'allowKubeToSelectCompose',
    ])
  ).name;
