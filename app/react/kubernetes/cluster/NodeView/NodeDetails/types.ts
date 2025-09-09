import { NodeAvailability, TaintEffect } from '../../types';

export interface NodeLabel {
  key: string;
  value: string;
  needsDeletion?: boolean;
  isNew: boolean;
  isChanged: boolean;
  isSystem: boolean;
}

export interface NodeTaint {
  key: string;
  value: string;
  effect: TaintEffect;
  needsDeletion?: boolean;
  isNew: boolean;
  isChanged: boolean;
}

export interface NodeFormValues {
  availability: NodeAvailability;
  labels: NodeLabel[];
  taints: NodeTaint[];
}

export interface NodeValidationData {
  isDrainOperationInProgress: boolean;
  isContainsPortainer: boolean;
}
