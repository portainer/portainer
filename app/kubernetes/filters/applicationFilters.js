import _ from 'lodash-es';
import { KubernetesApplicationDataAccessPolicies } from 'Kubernetes/models/application/models';

angular
  .module('portainer.kubernetes')
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
  })
  .filter('kubernetesApplicationDataAccessPolicyIcon', function () {
    'use strict';
    return function (value) {
      switch (value) {
        case KubernetesApplicationDataAccessPolicies.ISOLATED:
          return 'fa-cubes';
        case KubernetesApplicationDataAccessPolicies.SHARED:
          return 'fa-cube';
      }
    };
  })
  .filter('kubernetesApplicationDataAccessPolicyText', function () {
    'use strict';
    return function (value) {
      switch (value) {
        case KubernetesApplicationDataAccessPolicies.ISOLATED:
          return 'Isolated';
        case KubernetesApplicationDataAccessPolicies.SHARED:
          return 'Shared';
      }
    };
  })
  .filter('kubernetesApplicationDataAccessPolicyTooltip', function () {
    'use strict';
    return function (value) {
      switch (value) {
        case KubernetesApplicationDataAccessPolicies.ISOLATED:
          return 'All the instances of this application are using their own data.';
        case KubernetesApplicationDataAccessPolicies.SHARED:
          return 'All the instances of this application are sharing the same data.';
      }
    };
  });
