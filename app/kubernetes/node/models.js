/**
 * KubernetesNode Model
 */
const _KubernetesNode = Object.freeze({
  Id: '',
  Name: '',
  Labels: {},
  Role: '',
  Status: '',
  CPU: 0,
  Memory: '',
  Version: '',
  IPAddress: '',
  Api: false,
  Taints: [],
  Port: 0,
});

export class KubernetesNode {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesNode)));
  }
}

/**
 * KubernetesNodeDetails Model
 */
const _KubernetesNodeDetails = Object.freeze({
  CreationDate: '',
  OS: {
    Architecture: '',
    Platform: '',
    Image: '',
  },
  Conditions: [],
  Yaml: '',
});

export class KubernetesNodeDetails {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesNode)));
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesNodeDetails)));
  }
}
