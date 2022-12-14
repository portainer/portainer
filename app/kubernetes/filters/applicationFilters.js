import _ from 'lodash-es';
import { KubernetesApplicationDataAccessPolicies } from 'Kubernetes/models/application/models';
import { KubernetesApplicationTypes, KubernetesApplicationTypeStrings } from 'Kubernetes/models/application/models';
import { KubernetesPodNodeAffinityNodeSelectorRequirementOperators } from 'Kubernetes/pod/models';

angular
  .module('portainer.kubernetes')
  .filter('kubernetesApplicationTypeText', function () {
    'use strict';
    return function (type) {
      switch (type) {
        case KubernetesApplicationTypes.DEPLOYMENT:
          return KubernetesApplicationTypeStrings.DEPLOYMENT;
        case KubernetesApplicationTypes.DAEMONSET:
          return KubernetesApplicationTypeStrings.DAEMONSET;
        case KubernetesApplicationTypes.STATEFULSET:
          return KubernetesApplicationTypeStrings.STATEFULSET;
        case KubernetesApplicationTypes.POD:
          return KubernetesApplicationTypeStrings.POD;
        case KubernetesApplicationTypes.HELM:
          return KubernetesApplicationTypeStrings.HELM;
        default:
          return '-';
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
          return 'boxes';
        case KubernetesApplicationDataAccessPolicies.SHARED:
          return 'box';
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
  })
  .filter('kubernetesApplicationConstraintNodeAffinityValue', function () {
    'use strict';
    return function (values, operator) {
      if (operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.IN || operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.NOT_IN) {
        return values;
      } else if (
        operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.EXISTS ||
        operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.DOES_NOT_EXIST
      ) {
        return '';
      } else if (
        operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.GREATER_THAN ||
        operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.LOWER_THAN
      ) {
        return values[0];
      }
      return '';
    };
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
