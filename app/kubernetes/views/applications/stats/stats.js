import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ApplicationStatsView } from '@/react/kubernetes/applications/StatsView/ApplicationStatsView';

angular.module('portainer.kubernetes').component('kubernetesApplicationStatsView', r2a(withUIRouter(withReactQuery(withCurrentUser(ApplicationStatsView))), []));
