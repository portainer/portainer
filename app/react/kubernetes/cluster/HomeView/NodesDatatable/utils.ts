import { Node } from 'kubernetes-types/core/v1';

export function getInternalNodeIpAddress(node?: Node) {
  return node?.status?.addresses?.find(
    (address) => address.type === 'InternalIP'
  )?.address;
}

// most kube clusters set control-plane label, older clusters set master, microk8s doesn't have either but instead sets microk8s-controlplane
const controlPlaneLabels = [
  'node-role.kubernetes.io/control-plane',
  'node-role.kubernetes.io/master',
  'node.kubernetes.io/microk8s-controlplane',
];

const roleLabels = ['kubernetes.io/role'];

/**
 * Returns the role of the node based on the labels.
 * @param node The node to get the role of.
 * It uses similar logic to https://github.com/kubernetes/kubectl/blob/04bb64c802171066ed0d886c437590c0b7ff1ed3/pkg/describe/describe.go#L5523C1-L5541C2 ,
 * but only returns 'Control plane' or 'Worker'. It also has an additional check for microk8s.
 */
export function getRole(node: Node): 'Control plane' | 'Worker' {
  const hasControlPlaneLabel = controlPlaneLabels.some(
    (label) =>
      // the label can be set to an empty string, so we need to check for undefined
      // e.g. node-role.kubernetes.io/control-plane: ""
      node.metadata?.labels?.[label] !== undefined
  );
  const hasControlPlaneLabelValue = roleLabels.some(
    (label) =>
      node.metadata?.labels?.[label] === 'control-plane' ||
      node.metadata?.labels?.[label] === 'master'
  );

  if (hasControlPlaneLabel || hasControlPlaneLabelValue) {
    return 'Control plane';
  }
  return 'Worker';
}
