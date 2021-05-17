import controller from './kube-registry-access-view.controller';

export const kubernetesRegistryAccessView = {
  templateUrl: './kube-registry-access-view.html',
  controller,
  bindings: {
    endpoint: '<',
  },
};
