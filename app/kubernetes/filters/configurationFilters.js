import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';

angular.module('portainer.kubernetes').filter('kubernetesConfigurationTypeText', function () {
  'use strict';
  return function (type) {
    switch (type) {
      case KubernetesConfigurationTypes.SECRET:
        return 'Secret';
      case KubernetesConfigurationTypes.CONFIGMAP:
        return 'ConfigMap';
    }
  };
});
