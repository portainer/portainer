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
// this model will contain non transformed data (raw payload data)
// either during creation flow (model > api)
// than during reading flow (api > model)
export function KubernetesPodAffinity() {
  return {
    nodeAffinity: {}, // KubernetesPodNodeAffinityPayload
    // podAffinity: {},
    // podAntiAffinity: {},
  };
}
