import _ from 'lodash-es';

angular.module('portainer.kubernetes')
.filter('kubernetesApplicationServiceTypeIcon', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    switch (status) {
      case 'loadbalancer':
        return 'fa-project-diagram';
      case 'clusterip':
        return 'fa-list-alt';
      case 'nodeport':
        return 'fa-list';
    }
  };
})
.filter('kubernetesApplicationServiceTypeText', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    switch (status) {
      case 'loadbalancer':
        return 'Load balancer';
      case 'clusterip':
        return 'Internal';
      case 'nodeport':
        return 'Cluster';
    }
  };
})
.filter('kubernetesApplicationCPUValue', function () {
  'use strict';
  return function (value) {
    return _.round(value, 2);
  };
});
