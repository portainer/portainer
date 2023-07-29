import { KubernetesPodNodeAffinityNodeSelectorRequirementOperators } from '../pod/models';

export function nodeAffinityValues(
  values: string | string[],
  operator: KubernetesPodNodeAffinityNodeSelectorRequirementOperators
) {
  if (
    operator === KubernetesPodNodeAffinityNodeSelectorRequirementOperators.IN ||
    operator ===
      KubernetesPodNodeAffinityNodeSelectorRequirementOperators.NOT_IN
  ) {
    return values;
  }

  if (
    operator ===
      KubernetesPodNodeAffinityNodeSelectorRequirementOperators.EXISTS ||
    operator ===
      KubernetesPodNodeAffinityNodeSelectorRequirementOperators.DOES_NOT_EXIST
  ) {
    return '';
  }

  if (
    operator ===
      KubernetesPodNodeAffinityNodeSelectorRequirementOperators.GREATER_THAN ||
    operator ===
      KubernetesPodNodeAffinityNodeSelectorRequirementOperators.LOWER_THAN
  ) {
    return values[0];
  }
  return '';
}
