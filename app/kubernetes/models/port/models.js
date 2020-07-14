/**
 * PortMappingPort Model
 */
const _KubernetesPortMappingPort = Object.freeze({
  Port: 0,
  TargetPort: 0,
  Protocol: '',
  IngressRules: [], // KubernetesIngressRule[]
});

export class KubernetesPortMappingPort {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPortMappingPort)));
  }
}

/**
 * PortMapping Model
 */
const _KubernetesPortMapping = Object.freeze({
  Expanded: false,
  Highlighted: false,
  ResourcePool: '',
  ServiceType: '',
  ApplicationOwner: '',
  LoadBalancerIPAddress: '',
  Ports: [],
});

export class KubernetesPortMapping {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPortMapping)));
  }
}
