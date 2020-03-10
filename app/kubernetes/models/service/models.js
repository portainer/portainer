export const KubernetesServiceHeadlessSuffix = '-headless';
export const KubernetesServiceHeadlessClusterIP = 'None';
export const KubernetesServiceTypes = Object.freeze({
  LOAD_BALANCER: 'LoadBalancer',
  NODE_PORT: 'NodePort'
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
});

export class KubernetesService {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesService)));
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
  nodePort: 0
});

export class KubernetesServicePort {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesServicePort)));
  }
}