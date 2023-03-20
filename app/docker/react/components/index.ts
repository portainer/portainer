import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withControlledInput } from '@/react-tools/withControlledInput';
import { StackContainersDatatable } from '@/react/docker/stacks/ItemView/StackContainersDatatable';
import { ContainerQuickActions } from '@/react/docker/containers/components/ContainerQuickActions';
import { TemplateListDropdownAngular } from '@/react/docker/app-templates/TemplateListDropdown';
import { TemplateListSortAngular } from '@/react/docker/app-templates/TemplateListSort';
import { Gpu } from '@/react/docker/containers/CreateView/Gpu';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { DockerfileDetails } from '@/react/docker/images/ItemView/DockerfileDetails';
import { HealthStatus } from '@/react/docker/containers/ItemView/HealthStatus';
import { GpusList } from '@/react/docker/host/SetupView/GpusList';
import { GpusInsights } from '@/react/docker/host/SetupView/GpusInsights';
import { InsightsBox } from '@/react/components/InsightsBox';

export const componentsModule = angular
  .module('portainer.docker.react.components', [])
  .component('dockerfileDetails', r2a(DockerfileDetails, ['image']))
  .component('dockerHealthStatus', r2a(HealthStatus, ['health']))
  .component(
    'containerQuickActions',
    r2a(withUIRouter(withCurrentUser(ContainerQuickActions)), [
      'containerId',
      'nodeName',
      'state',
      'status',
      'taskId',
    ])
  )
  .component('templateListDropdown', TemplateListDropdownAngular)
  .component('templateListSort', TemplateListSortAngular)
  .component(
    'stackContainersDatatable',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(StackContainersDatatable))),
      ['environment', 'stackName']
    )
  )
  .component(
    'gpu',
    r2a(Gpu, [
      'values',
      'onChange',
      'gpus',
      'usedGpus',
      'usedAllGpus',
      'enableGpuManagement',
    ])
  )
  .component(
    'gpusList',
    r2a(withControlledInput(GpusList), ['value', 'onChange'])
  )
  .component(
    'insightsBox',
    r2a(InsightsBox, [
      'header',
      'content',
      'setHtmlContent',
      'insightCloseId',
      'type',
      'className',
    ])
  )
  .component('gpusInsights', r2a(GpusInsights, [])).name;
