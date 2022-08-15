import { KubernetesConfigurationKinds } from 'Kubernetes/models/configuration/models';

angular.module('portainer.kubernetes').filter('kubernetesConfigurationTypeText', function () {
  'use strict';
  return function (type) {
    switch (type) {
      case KubernetesConfigurationKinds.SECRET:
        return 'Secret';
      case KubernetesConfigurationKinds.CONFIGMAP:
        return 'ConfigMap';
    }
  };
});
