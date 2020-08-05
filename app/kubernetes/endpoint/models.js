export const KubernetesEndpointAnnotationLeader = 'control-plane.alpha.kubernetes.io/leader';

/**
 * KubernetesEndpoint Model
 */
const _KubernetesEndpoint = Object.freeze({
  Id: '',
  Name: '',
  Namespace: '',
  HolderIdentity: '',
  Subsets: [],
});

export class KubernetesEndpoint {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesEndpoint)));
  }
}

const _KubernetesEndpointSubset = Object.freeze({
  Ips: [],
  Port: 0,
});

export class KubernetesEndpointSubset {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesEndpointSubset)));
  }
}
