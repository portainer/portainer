import { KubernetesPodNodeAffinityNodeSelectorRequirementOperators } from '@/kubernetes/pod/models';

export interface Taint {
  Key: string;
  Value?: string;
  Effect: string;
}

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

export type Node = {
  Name: string;
  AcceptsApplication: boolean;
  UnmetTaints?: Array<Taint>;
  UnmatchedNodeSelectorLabels?: Array<Label>;
  Highlighted: boolean;
  UnmatchedNodeAffinities?: Array<Affinity>;
};
