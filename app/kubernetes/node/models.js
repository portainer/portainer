export const KubernetesPortainerNodeDrainLabel = 'io.portainer/node-status-drain';

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
  Availability: '',
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

/**
 * KubernetesNodeTaint Model
 */
const _KubernetesNodeTaint = Object.freeze({
  Key: '',
  Value: '',
  Effect: '',
});

export class KubernetesNodeTaint {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesNodeTaint)));
  }
}

export const KubernetesNodeAvailabilities = Object.freeze({
  ACTIVE: 'Active',
  PAUSE: 'Pause',
  DRAIN: 'Drain',
});

export const KubernetesNodeTaintEffects = Object.freeze({
  NOSCHEDULE: 'NoSchedule',
  PREFERNOSCHEDULE: 'PreferNoSchedule',
  NOEXECUTE: 'NoExecute',
});
