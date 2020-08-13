export function KubernetesPodNodeAffinityPayload() {
  return {
    requiredDuringSchedulingIgnoredDuringExecution: {
      nodeSelectorTerms: [], // []KubernetesNodeSelectorTermPayload
    },
    preferredDuringSchedulingIgnoredDuringExecution: [], // []KubernetesPreferredSchedulingTermPayload
  };
}

export function KubernetesPreferredSchedulingTermPayload() {
  return {
    weight: 1,
    preference: {}, // KubernetesNodeSelectorTermPayload
  };
}

export function KubernetesNodeSelectorTermPayload() {
  return {
    matchExpressions: [], // []KubernetesNodeSelectorRequirementPayload
  };
}

export function KubernetesNodeSelectorRequirementPayload() {
  return {
    key: '', // string
    operator: '', // KubernetesPodNodeAffinityNodeSelectorRequirementOperators
    values: [], // []string
  };
}
