import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { NodeStatsView } from '@/react/kubernetes/cluster/NodeStatsView/NodeStatsView';

angular.module('portainer.kubernetes').component('kubernetesNodeStatsView', r2a(withUIRouter(withReactQuery(withCurrentUser(NodeStatsView))), []));
