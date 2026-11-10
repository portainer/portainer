import { Node, Endpoints, EndpointAddress } from 'kubernetes-types/core/v1';

import { StatusBadgeType } from '@@/StatusBadge';

import { NodeAvailability } from './types';

const LABEL_NODE_ROLE_PREFIX = 'node-role.kubernetes.io/'; // Node role labels: https://kubernetes.io/docs/concepts/architecture/nodes/#node-roles
const NODE_LABEL_ROLE = 'kubernetes.io/role';
const NODE_LABEL_ROLE_ALT = 'node.kubernetes.io/role';

export function getNodeRoles(node: Node): string[] {
  // Mirrors kubectl role detection
  const labels = node.metadata?.labels ?? {};

  const entries = Object.entries(labels);

  const rolesFromPrefix = entries
    .filter(([key]) => key.startsWith(LABEL_NODE_ROLE_PREFIX))
    .map(([key]) => key.slice(LABEL_NODE_ROLE_PREFIX.length))
    .filter((role) => role.length > 0);

  const rolesFromValue = entries
    .filter(
      ([key, value]) =>
        (key === NODE_LABEL_ROLE || key === NODE_LABEL_ROLE_ALT) && value !== ''
    )
    .map(([, value]) => value);

  return Array.from(new Set<string>([...rolesFromPrefix, ...rolesFromValue]));
}

/**
 * Returns the role of the node based on the labels.
 * @param node The node to get the role of.
 * It uses similar logic to https://github.com/kubernetes/kubectl/blob/04bb64c802171066ed0d886c437590c0b7ff1ed3/pkg/describe/describe.go#L5523C1-L5541C2 ,
 * but only returns 'Control plane' or 'Worker'. It also has an additional check for microk8s.
 */
export function getRole(node: Node) {
  const roles = getNodeRoles(node);
  const isControlPlane =
    roles.includes('control-plane') || roles.includes('master');
  const isMicrok8sControlPlane =
    node.metadata?.labels?.['node.kubernetes.io/microk8s-controlplane'] !==
    undefined;

  if (isControlPlane || isMicrok8sControlPlane) {
    return 'Control plane';
  }
  return 'Worker';
}

type ApiDetails = {
  isApi: boolean;
  apiPort?: number;
};

/**
 * Determines if a node is serving the Kubernetes API and retrieves its port
 */
export function getNodeApiDetails(
  node: Node,
  endpoints: Endpoints[]
): ApiDetails {
  // Avoid misclassification of worker nodes as API nodes
  if (getRole(node) !== 'Control plane') {
    return { isApi: false };
  }
  const nodeName = node.metadata?.name;
  const nodeIpAddress = getInternalNodeIpAddress(node);
  const kubernetesEndpoint = endpoints.find(
    (e) => e.metadata?.name === 'kubernetes'
  ); // In-cluster 'kubernetes' Service for API discovery: https://kubernetes.io/docs/concepts/services-networking/service/#discovering-services

  type AddressPortPair = { address: EndpointAddress; port?: number };

  const addressPortPairs =
    kubernetesEndpoint?.subsets?.reduce<AddressPortPair[]>((acc, subset) => {
      const port = subset.ports?.[0]?.port; // Control plane ports (apiserver typically 6443): https://kubernetes.io/docs/reference/ports-and-protocols/#control-plane
      const pairs: AddressPortPair[] = (subset.addresses ?? []).map(
        (address) => ({ address, port })
      );
      return acc.concat(pairs);
    }, []) ?? [];

  const nodeNameMatch = addressPortPairs.find(
    ({ address }) =>
      address.nodeName && nodeName && address.nodeName === nodeName
  ); // Use EndpointAddress.nodeName to associate endpoints to nodes: https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#endpointaddress-v1-core

  if (nodeNameMatch) {
    return { isApi: true, apiPort: nodeNameMatch.port };
  }

  const ipMatch = nodeIpAddress
    ? addressPortPairs.find(({ address }) => address.ip === nodeIpAddress)
    : undefined;

  if (ipMatch) {
    return { isApi: true, apiPort: ipMatch.port };
  }

  return { isApi: false };
}

export function getInternalNodeIpAddress(node?: Node) {
  return node?.status?.addresses?.find(
    (address) => address.type === 'InternalIP'
  )?.address;
}

/**
 * If the environment url includes the node address, then it is a published node
 */
export function isNodePublished(node: Node, environmentUrl?: string) {
  const nodeAddress = getInternalNodeIpAddress(node);
  return (
    !!nodeAddress && !!environmentUrl && environmentUrl?.includes(nodeAddress)
  );
}

const KubernetesNodeConditionTypes = Object.freeze({
  READY: 'Ready',
  MEMORY_PRESSURE: 'MemoryPressure',
  PID_PRESSURE: 'PIDPressure',
  DISK_PRESSURE: 'DiskPressure',
  NETWORK_UNAVAILABLE: 'NetworkUnavailable',
});

/**
 * Returns the status of the node based on the conditions
 * @returns The status of the node. One of 'Ready', 'Warning', 'Unhealthy'
 */
export function getNodeStatus(node: Node): {
  status: string;
  statusType: StatusBadgeType;
  warningMessage?: string;
} {
  const readyCondition = node.status?.conditions?.find(
    (c) => c.type === 'Ready'
  );

  // Helper to check for specific condition type
  function hasCondition(type: string): boolean {
    return (
      node.status?.conditions?.some(
        (c) => c.type === type && c.status === 'True'
      ) || false
    );
  }

  // ready
  if (readyCondition?.status === 'True') {
    // check for warnings
    const conditions: Conditions = {
      MemoryPressure: hasCondition(
        KubernetesNodeConditionTypes.MEMORY_PRESSURE
      ),
      PIDPressure: hasCondition(KubernetesNodeConditionTypes.PID_PRESSURE),
      DiskPressure: hasCondition(KubernetesNodeConditionTypes.DISK_PRESSURE),
      NetworkUnavailable: hasCondition(
        KubernetesNodeConditionTypes.NETWORK_UNAVAILABLE
      ),
    };
    // ready with warnings
    if (Object.values(conditions).some(Boolean)) {
      return {
        status: 'Warning',
        statusType: 'warning',
        warningMessage: getNodeStatusMessage(conditions),
      };
    }
    // ready with no warnings
    return {
      status: 'Ready',
      statusType: 'success',
    };
  }
  // unknown
  if (readyCondition?.status === 'Unknown') {
    return {
      status: 'Warning',
      statusType: 'warning',
    };
  }
  // not ready
  return {
    status: 'Unhealthy',
    statusType: 'danger',
  };
}

type Conditions = {
  MemoryPressure: boolean;
  PIDPressure: boolean;
  DiskPressure: boolean;
  NetworkUnavailable: boolean;
};

function getNodeStatusMessage(conditions: Conditions) {
  if (conditions.MemoryPressure) {
    return 'Node memory is running low';
  }
  if (conditions.PIDPressure) {
    return 'Too many processes running on the node';
  }
  if (conditions.DiskPressure) {
    return 'Node disk capacity is running low';
  }
  if (conditions.NetworkUnavailable) {
    return 'Incorrect node network configuration';
  }
  return undefined;
}

export const KubernetesPortainerNodeDrainLabel =
  'io.portainer/node-status-drain';

export function getAvailability(node: Node): NodeAvailability {
  if (!node.spec?.unschedulable) {
    return 'Active';
  }
  if (
    Object.keys(node.metadata?.labels ?? {}).includes(
      KubernetesPortainerNodeDrainLabel
    )
  ) {
    return 'Drain';
  }
  return 'Pause';
}

export function isSystemLabel(labelKey: string): boolean {
  return (
    labelKey.startsWith('beta.kubernetes.io') ||
    labelKey.startsWith('kubernetes.io') ||
    labelKey === 'node-role.kubernetes.io/master' ||
    labelKey.startsWith('node-role.kubernetes.io/control-plane') ||
    labelKey.startsWith('node.kubernetes.io') ||
    labelKey === KubernetesPortainerNodeDrainLabel
  );
}

/**
 * Kubernetes has no standard label for the node pool a node belongs to, so each
 * distribution sets its own. Listed most to least specific, so that a node
 * provisioned by Karpenter inside an EKS cluster reports its Karpenter pool.
 *
 * A node outside any pool reports nothing, which is expected on kubeadm, k3s and
 * bare metal. It also happens on EKS self-managed node groups and on Fargate:
 * EKS only labels instances it manages itself.
 * https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html
 */
const NODE_GROUP_LABELS = [
  'karpenter.sh/nodepool', // Karpenter v1beta1 and later
  'eks.amazonaws.com/nodegroup', // EKS managed node groups only
  'cloud.google.com/gke-nodepool',
  'kubernetes.azure.com/agentpool', // AKS, alongside the bare 'agentpool' below
  'agentpool',
  'kops.k8s.io/instancegroup',
];

/**
 * The well-known instance type label, plus the deprecated beta key that older
 * cloud provider controllers still set.
 * https://kubernetes.io/docs/reference/labels-annotations-taints/#nodekubernetesioinstance-type
 */
const INSTANCE_TYPE_LABELS = [
  'node.kubernetes.io/instance-type',
  'beta.kubernetes.io/instance-type',
];

export function getNodeGroup(node: Node): string | undefined {
  return getFirstLabelValue(node, NODE_GROUP_LABELS);
}

export function getInstanceType(node: Node): string | undefined {
  return getFirstLabelValue(node, INSTANCE_TYPE_LABELS);
}

function getFirstLabelValue(
  node: Node,
  labelKeys: string[]
): string | undefined {
  const labels = node.metadata?.labels ?? {};
  const matchingKey = labelKeys.find((key) => labels[key]);
  return matchingKey ? labels[matchingKey] : undefined;
}

/**
 * Formats the node labels the way kubectl does, so they can be read and
 * searched as a single string: `key=value`, sorted by key. Valueless labels
 * keep the separator and render as `key=`, matching `kubectl describe node`.
 *
 * Sorting happens on the key rather than the formatted string, because `-` and
 * `.` sort before `=`: an EKS node carries both `eks.amazonaws.com/nodegroup`
 * and `eks.amazonaws.com/nodegroup-image`, and formatting first would put the
 * image below the node group. Compared with `<` rather than localeCompare so
 * the order matches kubectl's byte ordering; label keys are always ASCII.
 */
export function getNodeLabelStrings(node: Node): string[] {
  return Object.entries(node.metadata?.labels ?? {})
    .sort(([leftKey], [rightKey]) => compareKeys(leftKey, rightKey))
    .map(([key, value]) => `${key}=${value}`);
}

function compareKeys(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

/**
 * Formats the node taints the way kubectl does: `key=value:Effect`, with the
 * value omitted when the taint has none.
 */
export function getNodeTaintStrings(node: Node): string[] {
  return (node.spec?.taints ?? []).map(
    ({ key, value, effect }) => `${key}${value ? `=${value}` : ''}:${effect}`
  );
}
