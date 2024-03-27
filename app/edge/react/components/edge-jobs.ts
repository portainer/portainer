import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ResultsDatatable } from '@/react/edge/edge-jobs/ItemView/ResultsDatatable/ResultsDatatable';

export const edgeJobsModule = angular
  .module('portainer.edge.react.components.edge-jobs', [])
  .component(
    'edgeJobResultsDatatable',
    r2a(withUIRouter(ResultsDatatable), [
      'dataset',
      'onClearLogs',
      'onCollectLogs',
      'onDownloadLogs',
      'onRefresh',
    ])
  ).name;
