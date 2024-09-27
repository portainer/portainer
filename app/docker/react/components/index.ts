import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withControlledInput } from '@/react-tools/withControlledInput';
import { StackContainersDatatable } from '@/react/common/stacks/ItemView/StackContainersDatatable';
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
import { SecretsDatatable } from '@/react/docker/secrets/ListView/SecretsDatatable';
import { StacksDatatable } from '@/react/docker/stacks/ListView/StacksDatatable';
import { NetworksDatatable } from '@/react/docker/networks/ListView/NetworksDatatable';

import { containersModule } from './containers';
import { servicesModule } from './services';
import { networksModule } from './networks';
import { swarmModule } from './swarm';
import { volumesModule } from './volumes';
import { templatesModule } from './templates';

const ngModule = angular
  .module('portainer.docker.react.components', [
    containersModule,
    servicesModule,
    networksModule,
    swarmModule,
    volumesModule,
    templatesModule,
  ])
  .component('dockerfileDetails', r2a(DockerfileDetails, ['image']))
  .component('dockerHealthStatus', r2a(HealthStatus, ['health']))
  .component(
    'stackContainersDatatable',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(StackContainersDatatable))),
      ['environment', 'stackName']
    )
  )
  .component(
    'networksDatatable',
    r2a(withUIRouter(withCurrentUser(NetworksDatatable)), [
      'dataset',
      'onRefresh',
      'onRemove',
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
    r2a(withUIRouter(withCurrentUser(ConfigsDatatable)), [
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
    r2a(withUIRouter(withReactQuery(withCurrentUser(ProcessesDatatable))), [])
  )
  .component('dockerEventsDatatable', r2a(EventsDatatable, ['dataset']))
  .component(
    'dockerSecretsDatatable',
    r2a(withUIRouter(withCurrentUser(SecretsDatatable)), [
      'dataset',
      'onRefresh',
      'onRemove',
    ])
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
