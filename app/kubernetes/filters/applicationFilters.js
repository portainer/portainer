import { cpuHumanValue } from '@/react/kubernetes/applications/utils/cpuHumanValue';
import { nodeAffinityValues } from './application';

angular
  .module('portainer.kubernetes')
  .filter('kubernetesApplicationCPUValue', function () {
    'use strict';
    return cpuHumanValue;
  })
  .filter('kubernetesApplicationDataAccessPolicyIcon', function () {
    'use strict';
    return function (value) {
      switch (value) {
        case 'Isolated':
          return 'boxes';
        case 'Shared':
          return 'box';
      }
    };
  })
  .filter('kubernetesApplicationDataAccessPolicyTooltip', function () {
    'use strict';
    return function (value) {
      switch (value) {
        case 'Isolated':
          return 'All the instances of this application are using their own data.';
        case 'Shared':
          return 'All the instances of this application are sharing the same data.';
      }
    };
  })
  .filter('kubernetesApplicationConstraintNodeAffinityValue', function () {
    'use strict';
    return nodeAffinityValues;
  })
  .filter('kubernetesNodeLabelHumanReadbleText', function () {
    'use strict';
    return function (text) {
      const values = {
        'kubernetes.io/os': 'Operating system',
        'kubernetes.io/arch': 'Architecture',
        'kubernetes.io/hostname': 'Node',
      };
      return values[text] || text;
    };
  })
  .filter('kubernetesApplicationIngressEmptyHostname', function () {
    'use strict';
    return function (value) {
      if (value === '') {
        return '<use IP>';
      } else {
        return value;
      }
    };
  });
