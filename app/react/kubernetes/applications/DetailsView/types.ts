import { Taint } from 'kubernetes-types/core/v1';

import { KubernetesPodNodeAffinityNodeSelectorRequirementOperators } from '@/kubernetes/pod/models';

export interface Label {
  key: string;
  value: string;
}

interface AffinityTerm {
  key: string;
  operator: KubernetesPodNodeAffinityNodeSelectorRequirementOperators;
  values: string;
}

export type Affinity = Array<AffinityTerm>;

export type NodePlacementRowData = {
  name: string;
  acceptsApplication: boolean;
  unmetTaints?: Array<Taint>;
  unmatchedNodeSelectorLabels?: Array<Label>;
  highlighted: boolean;
  unmatchedNodeAffinities?: Array<Affinity>;
};
