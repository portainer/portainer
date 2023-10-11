import { Node } from 'kubernetes-types/core/v1';

export function getInternalNodeIpAddress(node?: Node) {
  return node?.status?.addresses?.find(
    (address) => address.type === 'InternalIP'
  )?.address;
}

// most kube clusters set control-plane label, older clusters set master, microk8s doesn't have either but instead sets microk8s-controlplane
const masterLabels = [
  'node-role.kubernetes.io/control-plane',
  'node-role.kubernetes.io/master',
  'node.kubernetes.io/microk8s-controlplane',
];

export function getRole(node: Node): 'Control plane' | 'Worker' {
  return masterLabels.some((label) => node.metadata?.labels?.[label])
    ? 'Control plane'
    : 'Worker';
}
