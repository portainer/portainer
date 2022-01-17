export const KubernetesServiceHeadlessPrefix = 'headless-';
export const KubernetesServiceHeadlessClusterIP = 'None';
export const KubernetesServiceTypes = Object.freeze({
  LOAD_BALANCER: 'LoadBalancer',
  NODE_PORT: 'NodePort',
  CLUSTER_IP: 'ClusterIP',
  INGRESS: 'Ingress',
});

/**
 * KubernetesService Model
 */
const _KubernetesService = Object.freeze({
  Headless: false,
  Namespace: '',
  Name: '',
  StackName: '',
  Ports: [],
  Type: '',
  ClusterIP: '',
  ApplicationName: '',
  ApplicationOwner: '',
  Note: '',
  Ingress: false,
  Selector: {},
});

export class KubernetesService {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesService)));
  }
}

const _KubernetesIngressService = Object.freeze({
  Headless: false,
  Namespace: '',
  Name: '',
  StackName: '',
  Ports: [],
  Type: '',
  ClusterIP: '',
  ApplicationName: '',
  ApplicationOwner: '',
  Note: '',
  Ingress: true,
  IngressRoute: [],
});

export class KubernetesIngressService {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesIngressService)));
  }
}

const _KubernetesIngressServiceRoute = Object.freeze({
  Host: '',
  IngressName: '',
  Path: '',
  ServiceName: '',
});

export class KubernetesIngressServiceRoute {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesIngressServiceRoute)));
  }
}

/**
 * KubernetesServicePort Model
 */
const _KubernetesServicePort = Object.freeze({
  name: '',
  port: 0,
  targetPort: 0,
  protocol: '',
  nodePort: 0,
  ingress: '',
});

export class KubernetesServicePort {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesServicePort)));
  }
}
