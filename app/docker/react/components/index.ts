import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withControlledInput } from '@/react-tools/withControlledInput';
import { StackContainersDatatable } from '@/react/common/stacks/ItemView/StackContainersDatatable';
import { ContainerQuickActions } from '@/react/docker/containers/components/ContainerQuickActions';
import { TemplateListDropdownAngular } from '@/react/docker/app-templates/TemplateListDropdown';
import { TemplateListSortAngular } from '@/react/docker/app-templates/TemplateListSort';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { DockerfileDetails } from '@/react/docker/images/ItemView/DockerfileDetails';
import { HealthStatus } from '@/react/docker/containers/ItemView/HealthStatus';
import { GpusList } from '@/react/docker/host/SetupView/GpusList';
import { InsightsBox } from '@/react/components/InsightsBox';
import { BetaAlert } from '@/react/portainer/environments/update-schedules/common/BetaAlert';
import { ImagesDatatable } from '@/react/docker/images/ListView/ImagesDatatable/ImagesDatatable';
import { EventsDatatable } from '@/react/docker/events/EventsDatatables';
import { ConfigsDatatable } from '@/react/docker/configs/ListView/ConfigsDatatable';
import { AgentHostBrowser } from '@/react/docker/host/BrowseView/AgentHostBrowser';
import { AgentVolumeBrowser } from '@/react/docker/volumes/BrowseView/AgentVolumeBrowser';
import { ProcessesDatatable } from '@/react/docker/containers/StatsView/ProcessesDatatable';
import { ScaleServiceButton } from '@/react/docker/services/ListView/ServicesDatatable/columns/schedulingMode/ScaleServiceButton';
import { SecretsDatatable } from '@/react/docker/secrets/ListView/SecretsDatatable';
import { StacksDatatable } from '@/react/docker/stacks/ListView/StacksDatatable';

import { containersModule } from './containers';
import { servicesModule } from './services';
import { networksModule } from './networks';
import { swarmModule } from './swarm';

const ngModule = angular
  .module('portainer.docker.react.components', [
    containersModule,
    servicesModule,
    networksModule,
    swarmModule,
  ])
  .component('dockerfileDetails', r2a(DockerfileDetails, ['image']))
  .component('dockerHealthStatus', r2a(HealthStatus, ['health']))
  .component(
    'containerQuickActions',
    r2a(withUIRouter(withCurrentUser(ContainerQuickActions)), [
      'containerId',
      'nodeName',
      'state',
      'status',
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
    'gpusList',
    r2a(withControlledInput(GpusList), ['value', 'onChange'])
  )
  .component(
    'insightsBox',
    r2a(InsightsBox, [
      'header',
      'content',
      'insightCloseId',
      'type',
      'className',
    ])
  )
  .component('betaAlert', r2a(BetaAlert, ['className', 'message', 'isHtml']))
  .component(
    'dockerImagesDatatable',
    r2a(withUIRouter(withCurrentUser(ImagesDatatable)), [
      'onRemove',
      'isExportInProgress',
      'isHostColumnVisible',
      'onDownload',
      'onRemove',
    ])
  )
  .component(
    'dockerConfigsDatatable',
    r2a(withUIRouter(ConfigsDatatable), [
      'dataset',
      'onRemoveClick',
      'onRefresh',
    ])
  )
  .component(
    'agentHostBrowserReact',
    r2a(withUIRouter(withCurrentUser(AgentHostBrowser)), [
      'dataset',
      'isRoot',
      'onBrowse',
      'onDelete',
      'onDownload',
      'onFileSelectedForUpload',
      'onGoToParent',
      'onRename',
      'relativePath',
    ])
  )
  .component(
    'agentVolumeBrowserReact',
    r2a(withUIRouter(withCurrentUser(AgentVolumeBrowser)), [
      'dataset',
      'isRoot',
      'isUploadAllowed',
      'onBrowse',
      'onDelete',
      'onDownload',
      'onFileSelectedForUpload',
      'onGoToParent',
      'onRename',
      'relativePath',
    ])
  )
  .component(
    'dockerContainerProcessesDatatable',
    r2a(ProcessesDatatable, ['dataset', 'headers'])
  )
  .component(
    'dockerServicesDatatableScaleServiceButton',
    r2a(withUIRouter(withCurrentUser(ScaleServiceButton)), ['service'])
  )
  .component('dockerEventsDatatable', r2a(EventsDatatable, ['dataset']))
  .component(
    'dockerSecretsDatatable',
    r2a(withUIRouter(SecretsDatatable), ['dataset', 'onRefresh', 'onRemove'])
  )
  .component(
    'dockerStacksDatatable',
    r2a(withUIRouter(withCurrentUser(StacksDatatable)), [
      'dataset',
      'isImageNotificationEnabled',
      'onReload',
      'onRemove',
    ])
  );
export const componentsModule = ngModule.name;
