import angular from 'angular';

import { kubernetesRegistryAccessView } from './kube-registry-access-view';

export default angular.module('portainer.kubernetes.registries', []).component('kubernetesRegistryAccessView', kubernetesRegistryAccessView).name;
