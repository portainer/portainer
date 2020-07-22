export * from './affinities';

/**
 * KubernetesPod Model
 */
const _KubernetesPod = Object.freeze({
  Id: '',
  Name: '',
  Namespace: '',
  Images: [],
  Status: '',
  Restarts: 0,
  Node: '',
  CreationDate: '',
  Containers: [],
  Labels: [],
  Affinity: {}, // KubernetesPodAffinity
  Tolerations: [], // KubernetesPodToleration[]
});

export class KubernetesPod {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPod)));
  }
}

/**
 * KubernetesPodToleration Model
 */
const _KubernetesPodToleration = Object.freeze({
  Key: '',
  Operator: '',
  Value: '',
  TolerationSeconds: 0,
  Effect: '',
});

export class KubernetesPodToleration {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPodToleration)));
  }
}
