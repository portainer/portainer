export const KubernetesPodNodeAffinityNodeSelectorRequirementOperators = Object.freeze({
  IN: 'In',
  NOT_IN: 'NotIn',
  EXISTS: 'Exists',
  DOES_NOT_EXIST: 'DoesNotExist',
  GREATER_THAN: 'Gt',
  LOWER_THAN: 'Lt',
});

/**
 * KubernetesPodAffinity Model
 */
const _KubernetesPodAffinity = Object.freeze({
  NodeAffinity: {},
  // PodAffinity: {},
  // PodAntiAffinity: {},
});

export class KubernetesPodAffinity {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPodAffinity)));
  }
}

/**
 * KubernetesPodNodeAffinity Model
 */
const _KubernetesPodNodeAffinity = Object.freeze({
  PreferredDuringSchedulingIgnoredDuringExecution: [],
  RequiredDuringSchedulingIgnoredDuringExecution: {},
});

export class KubernetesPodNodeAffinity {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPodNodeAffinity)));
  }
}

/**
 * KubernetesPodPodAffinity Model
 */
const _KubernetesPodPodAffinity = Object.freeze({
  PreferredDuringSchedulingIgnoredDuringExecution: [],
  equiredDuringSchedulingIgnoredDuringExecution: [],
});

export class KubernetesPodPodAffinity {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPodPodAffinity)));
  }
}

/**
 * KubernetesPodPodAntiAffinity Model
 */
const _KubernetesPodPodAntiAffinity = Object.freeze({
  preferredDuringSchedulingIgnoredDuringExecution: [],
  requiredDuringSchedulingIgnoredDuringExecution: [],
});

export class KubernetesPodPodAntiAffinity {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPodPodAntiAffinity)));
  }
}
